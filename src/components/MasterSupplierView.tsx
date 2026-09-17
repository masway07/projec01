import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building,
  CreditCard,
  X
} from 'lucide-react';
import { Supplier } from '../types';

interface MasterSupplierViewProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export const MasterSupplierView: React.FC<MasterSupplierViewProps> = ({
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET 30');
  const [npwp, setNpwp] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingSupplier(null);
    const nextSeq = suppliers.length + 1;
    const formattedCode = `SUP-${String(nextSeq).padStart(3, '0')}`;
    setCode(formattedCode);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setPaymentTerms('NET 30');
    setNpwp('');
    setCurrency('IDR');
    setIsActive(true);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setCode(sup.code);
    setName(sup.name);
    setContactPerson(sup.contactPerson || '');
    setPhone(sup.phone || '');
    setEmail(sup.email || '');
    setAddress(sup.address || '');
    setCity(sup.city || '');
    setPaymentTerms(sup.paymentTerms || 'NET 30');
    setNpwp(sup.npwp || '');
    setCurrency(sup.currency || 'IDR');
    setIsActive(sup.isActive);
    setNotes(sup.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        paymentTerms: paymentTerms.trim(),
        npwp: npwp.trim(),
        currency,
        isActive,
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddSupplier({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        paymentTerms: paymentTerms.trim(),
        npwp: npwp.trim(),
        currency,
        isActive,
        notes: notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter(sup => {
    const matchSearch =
      sup.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.contactPerson && sup.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sup.city && sup.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && sup.isActive) ||
      (statusFilter === 'inactive' && !sup.isActive);

    return matchSearch && matchStatus;
  });

  const activeCount = suppliers.filter(s => s.isActive).length;
  const valasCount = suppliers.filter(s => s.currency !== 'IDR').length;

  return (
    <div id="view-master-supplier" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <Truck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Data Supplier</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Daftar vendor dan rekanan pengadaan bahan baku, mold & dies, pelumas, dan sparepart
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnAddSupplier"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Supplier
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total Supplier</div>
            <div className="text-lg font-bold text-white mt-0.5">{suppliers.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Supplier Aktif</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px] font-medium">Supplier Valas (USD/JPY)</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{valasCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama supplier, kontak..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Kode & Nama Supplier</th>
                <th className="py-3.5 px-4">Kontak Person</th>
                <th className="py-3.5 px-4">Alamat & Kota</th>
                <th className="py-3.5 px-4">Termin & Valuta</th>
                <th className="py-3.5 px-4">NPWP</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada data supplier yang cocok.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      <div className="text-[11px] font-mono text-indigo-600 font-semibold">{sup.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{sup.contactPerson || '-'}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {sup.phone && <span>{sup.phone}</span>}
                        {sup.email && <span className="truncate max-w-[150px]">{sup.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs truncate text-slate-700">{sup.address || '-'}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{sup.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{sup.paymentTerms}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-700">
                        {sup.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {sup.npwp || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sup.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(sup)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus supplier ${sup.name}?`)) {
                              onDeleteSupplier(sup.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Truck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSupplier ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Supplier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="SUP-001"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Perusahaan Supplier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="PT Krakatau Steel Tbk"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Nama PIC"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Telepon / HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+62 21 8900..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sales@vendor.co.id"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Kawasan Industri MM2100 Blok C..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota / Wilayah
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Cikarang, Bekasi"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Termin Pembayaran (TOP)
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="NET 14">NET 14 Hari</option>
                    <option value="NET 30">NET 30 Hari</option>
                    <option value="NET 45">NET 45 Hari</option>
                    <option value="NET 60">NET 60 Hari</option>
                    <option value="DP 50%">DP 50% Pelunasan Net 30</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang Default
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="IDR">IDR - Rupiah</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NPWP Perusahaan
                  </label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={e => setNpwp(e.target.value)}
                    placeholder="01.234.567.8-000.000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Spesialisasi
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Kualifikasi material, drawing spesifik, lead time rata-rata..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="supActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="supActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Supplier Aktif (Dapat dipilih dalam Purchase Order)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
