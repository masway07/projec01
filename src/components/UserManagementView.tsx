import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Lock,
  Mail,
  User,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Building2
} from 'lucide-react';
import { AppPermission, AppUser, Department, UserRole } from '../types';
import { ALL_PERMISSIONS, ROLE_PRESETS, generateStrongPassword } from '../utils/userUtils';

interface UserManagementViewProps {
  users: AppUser[];
  currentUser: AppUser | null;
  departments: Department[];
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  departments,
  onSaveUser,
  onDeleteUser,
  onToggleStatus
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('dept_user');
  const [deptCode, setDeptCode] = useState<string>('');
  const [permissions, setPermissions] = useState<AppPermission[]>(ROLE_PRESETS.dept_user.permissions);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [copiedPass, setCopiedPass] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Password Generator
  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword(12, { includeSymbols: true, includeNumbers: true });
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
    const newPass = generateStrongPassword(12);
    setPassword(newPass);
    setShowPassword(true);
    setRole('dept_user');
    setDeptCode(departments[0]?.code || 'ACC');
    setPermissions(ROLE_PRESETS.dept_user.permissions);
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEmail(u.email);
    setName(u.name);
    setPassword(u.password);
    setShowPassword(false);
    setRole(u.role);
    setDeptCode(u.deptCode || '');
    setPermissions(u.permissions);
    setIsActive(u.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole !== 'custom') {
      setPermissions(ROLE_PRESETS[newRole].permissions);
    }
  };

  const handleTogglePermission = (permId: AppPermission) => {
    setRole('custom');
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !name.trim() || !password.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    // Check duplicate email
    const exists = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== editingUser?.id);
    if (exists) {
      setErrorMsg(`Email "${email}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.');
      return;
    }

    const savedUser: AppUser = {
      id: editingUser ? editingUser.id : `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password: password.trim(),
      role,
      roleLabel: ROLE_PRESETS[role]?.label || 'Kustom',
      permissions: permissions.length > 0 ? permissions : ['dashboard'],
      deptCode: deptCode || undefined,
      isActive,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString()
    };

    onSaveUser(savedUser);
    setIsModalOpen(false);
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.deptCode && u.deptCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="view-users" className="space-y-6 animate-in fade-in duration-150">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>Manajemen User &amp; Hak Akses</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola akun pengguna, generator password otomatis, dan pembatasan hak akses modul.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 text-sm cursor-pointer w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah User Baru</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 text-xs text-indigo-950 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-sm text-indigo-900">Kontrol Hak Akses Berbasis Modul</div>
          <p className="mt-0.5 leading-relaxed text-indigo-800/90">
            Setiap user yang login hanya dapat melihat dan mengakses menu-menu yang dicentang pada hak aksesnya. Anda dapat menggunakan generator password otomatis agar setiap user memiliki kata sandi yang kuat dan aman.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama, email, atau departemen..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Role Filter */}
          <div className="w-48">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Semua Hak Akses</option>
              <option value="admin">Administrator</option>
              <option value="finance">Finance &amp; Accounting</option>
              <option value="dept_user">Department User</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <strong>{filteredUsers.length}</strong> pengguna
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold">
                <th className="p-3.5">Pengguna</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Hak Akses (Role)</th>
                <th className="p-3.5">Dept</th>
                <th className="p-3.5">Jumlah Menu Diizinkan</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ada pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3.5 font-medium text-slate-700">{u.email}</td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'finance'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : u.role === 'dept_user'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {ROLE_PRESETS[u.role]?.label || u.roleLabel}
                        </span>
                      </td>

                      {/* Dept */}
                      <td className="p-3.5 font-bold text-indigo-700">{u.deptCode || '-'}</td>

                      {/* Permissions Count */}
                      <td className="p-3.5">
                        {u.role === 'admin' ? (
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 text-[11px]">
                            Akses Penuh (Semua Modul)
                          </span>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800">{u.permissions.length}</span>
                            <span className="text-slate-400"> dari {ALL_PERMISSIONS.length} modul</span>
                          </>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onToggleStatus(u.id)}
                          disabled={isCurrent}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          } ${isCurrent ? 'cursor-not-allowed opacity-60' : ''}`}
                          title={isCurrent ? 'Tidak dapat menonaktifkan akun sendiri' : 'Klik untuk ganti status'}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer flex items-center gap-1"
                            title="Edit User & Hak Akses"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              if (isCurrent) {
                                alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan untuk login.');
                                return;
                              }
                              if (window.confirm(`Apakah Anda yakin ingin menghapus user "${u.name}" (${u.email})?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            disabled={isCurrent}
                            className={`px-2.5 py-1 text-xs border border-rose-300 text-rose-600 rounded hover:bg-rose-50 font-medium transition cursor-pointer flex items-center gap-1 ${
                              isCurrent ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                            title={isCurrent ? 'Akun aktif' : 'Hapus User'}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  {editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Atur informasi akun, kata sandi terenkripsi/acak, dan batas hak akses menu.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Pengguna (Untuk Login)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contoh: user@smartbudget.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="contoh: Budi Setiawan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Password with Generator */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Kata Sandi (Password)
                    </label>

                    {/* Generator Button */}
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition"
                      title="Buat password acak yang kuat"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Generate Password Otomatis</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Masukkan atau generate password..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0 transition"
                      title="Salin password ke clipboard"
                    >
                      {copiedPass ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-500" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan tombol "Generate Password Otomatis" untuk menghasilkan kata sandi unik dan aman.
                  </p>
                </div>

                {/* Hak Akses / Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Pilihan Role (Hak Akses)
                  </label>
                  <select
                    value={role}
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="admin">Administrator (Akses Penuh Seluruh Menu)</option>
                    <option value="finance">Finance &amp; Accounting</option>
                    <option value="dept_user">Department User</option>
                    <option value="custom">Custom (Atur Per Menu Secara Manual)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {ROLE_PRESETS[role]?.description}
                  </p>
                </div>

                {/* Department Affiliation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Departemen Pengguna (Opsional)
                  </label>
                  <select
                    value={deptCode}
                    onChange={e => setDeptCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Semua Departemen (Lintas Dept)</option>
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detail Hak Akses Menu (Permission Checkboxes) */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    Daftar Menu yang Diizinkan ({permissions.length} terpilih)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('custom');
                        setPermissions(ALL_PERMISSIONS.map(p => p.id));
                      }}
                      className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRole('custom');
                        setPermissions(['dashboard']);
                      }}
                      className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Reset Minimal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {ALL_PERMISSIONS.map(p => {
                    const isChecked = permissions.includes(p.id);

                    return (
                      <label
                        key={p.id}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs transition border ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(p.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-bold">{p.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{p.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-semibold text-slate-700">Status Akun:</label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{isActive ? 'Akun Aktif (Dapat Login)' : 'Akun Dinonaktifkan'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Simpan User Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
