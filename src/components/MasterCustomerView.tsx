import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building2,
  X
} from 'lucide-react';
import { Customer } from '../types';

interface MasterCustomerViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const MasterCustomerView: React.FC<MasterCustomerViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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
  const [currency, setCurrency] = useState('USD');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingCustomer(null);
    const nextSeq = customers.length + 1;
    const formattedCode = `CUST-${String(nextSeq).padStart(3, '0')}`;
    setCode(formattedCode);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setPaymentTerms('NET 30');
    setNpwp('');
    setCurrency('USD');
    setIsActive(true);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCode(cust.code);
    setName(cust.name);
    setContactPerson(cust.contactPerson || '');
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setCity(cust.city || '');
    setPaymentTerms(cust.paymentTerms || 'NET 30');
    setNpwp(cust.npwp || '');
    setCurrency(cust.currency || 'USD');
    setIsActive(cust.isActive);
    setNotes(cust.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
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
      onAddCustomer({
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

  const filteredCustomers = customers.filter(cust => {
    const matchSearch =
      cust.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.contactPerson && cust.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cust.city && cust.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cust.isActive) ||
      (statusFilter === 'inactive' && !cust.isActive);

    return matchSearch && matchStatus;
  });

  const activeCount = customers.filter(c => c.isActive).length;
  const exportCount = customers.filter(c => c.currency === 'USD' || (c.city && c.city.toLowerCase().includes('china'))).length;

  return (
    <div id="view-master-customer" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Master Data Customer</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Daftar pelanggan OEM, Tier-1, distributor lokal dan pasar ekspor
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnAddCustomer"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Customer
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total Customer</div>
            <div className="text-lg font-bold text-white mt-0.5">{customers.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Customer Aktif</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[11px] font-medium">Customer USD / Ekspor</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{exportCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama customer, kota..."
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

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Kode & Nama Customer</th>
                <th className="py-3.5 px-4">Kontak Person</th>
                <th className="py-3.5 px-4">Alamat & Kota</th>
                <th className="py-3.5 px-4">Termin & Valuta</th>
                <th className="py-3.5 px-4">NPWP / Tax ID</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada data customer yang cocok.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] font-mono text-indigo-600 font-semibold">{cust.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{cust.contactPerson || '-'}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {cust.phone && <span>{cust.phone}</span>}
                        {cust.email && <span className="truncate max-w-[150px]">{cust.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs truncate text-slate-700">{cust.address || '-'}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{cust.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{cust.paymentTerms}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-700">
                        {cust.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {cust.npwp || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {cust.isActive ? (
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
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus customer ${cust.name}?`)) {
                              onDeleteCustomer(cust.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Customer"
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
                  <Briefcase className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCustomer ? 'Edit Data Customer' : 'Tambah Customer Baru'}
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
                    Kode Customer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="CUST-001"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Customer / Perusahaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="PT Toyota Motor Manufacturing Indonesia"
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
                    placeholder="Nama PIC Buyer"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+62 21 651..."
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
                    placeholder="purchasing@toyota.co.id"
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
                    placeholder="Jl. Laks. Yos Sudarso, Sunter II..."
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
                    placeholder="Jakarta Utara"
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
                    <option value="NET 90">NET 90 Hari</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang Transaksi
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="IDR">IDR - Rupiah</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NPWP / Tax ID
                  </label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={e => setNpwp(e.target.value)}
                    placeholder="01.000.014.1-092.000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Bisnis
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Tier-1 Automotive OEM, delivery schedule requirement, kawasan berikat..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="custActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="custActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Customer Aktif (Dapat dipilih dalam Sales Plan, Delivery, dan Invoice)
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
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
