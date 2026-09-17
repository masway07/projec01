import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  ShoppingCart,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import { PurchaseRequest, PurchaseRequestItem, Department, ItemStock } from '../types';

interface PurchaseRequestViewProps {
  purchaseRequests: PurchaseRequest[];
  departments: Department[];
  itemStocks: ItemStock[];
  onAddPR: (pr: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePR: (pr: PurchaseRequest) => void;
  onDeletePR: (id: string) => void;
  onApprovePR: (id: string, approverName: string) => void;
  onRejectPR: (id: string) => void;
  onCreatePOFromPR?: (pr: PurchaseRequest) => void;
}

export const PurchaseRequestView: React.FC<PurchaseRequestViewProps> = ({
  purchaseRequests,
  departments,
  itemStocks,
  onAddPR,
  onUpdatePR,
  onDeletePR,
  onApprovePR,
  onRejectPR,
  onCreatePOFromPR
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalPR, setDetailModalPR] = useState<PurchaseRequest | null>(null);
  const [editingPR, setEditingPR] = useState<PurchaseRequest | null>(null);

  // Form states
  const [prNumber, setPrNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptCode, setDeptCode] = useState(departments[0]?.code || 'ENG');
  const [deptName, setDeptName] = useState(departments[0]?.name || 'Production Engineering');
  const [requesterName, setRequesterName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  // Item lines state
  const [items, setItems] = useState<PurchaseRequestItem[]>([
    {
      id: 'pr_item_temp_1',
      itemCode: itemStocks[0]?.code || 'RM-S45C-D28',
      itemName: itemStocks[0]?.name || 'Round Steel Bar S45C Dia 28mm',
      description: '',
      qty: 1,
      uom: itemStocks[0]?.uom || 'Kg',
      estimatedPrice: itemStocks[0]?.standardCost || 0,
      currency: 'USD',
      totalEstimated: itemStocks[0]?.standardCost || 0,
      requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    }
  ]);

  const handleDeptSelect = (code: string) => {
    setDeptCode(code);
    const d = departments.find(dep => dep.code === code);
    if (d) setDeptName(d.name);
  };

  const handleItemSelect = (index: number, code: string) => {
    const selected = itemStocks.find(i => i.code === code);
    setItems(prev => {
      const copy = [...prev];
      if (selected) {
        copy[index] = {
          ...copy[index],
          itemCode: selected.code,
          itemName: selected.name,
          uom: selected.uom,
          estimatedPrice: selected.standardCost,
          currency: selected.currency || currency,
          totalEstimated: (selected.standardCost || 0) * (copy[index].qty || 1)
        };
      } else {
        copy[index].itemCode = code;
      }
      return copy;
    });
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].qty = qty;
      copy[index].totalEstimated = qty * (copy[index].estimatedPrice || 0);
      return copy;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].estimatedPrice = price;
      copy[index].totalEstimated = (copy[index].qty || 0) * price;
      return copy;
    });
  };

  const handleAddItemLine = () => {
    const defaultItem = itemStocks[0];
    setItems(prev => [
      ...prev,
      {
        id: `pr_item_temp_${Date.now()}`,
        itemCode: defaultItem?.code || '',
        itemName: defaultItem?.name || '',
        description: '',
        qty: 1,
        uom: defaultItem?.uom || 'Pcs',
        estimatedPrice: defaultItem?.standardCost || 0,
        currency: defaultItem?.currency || currency,
        totalEstimated: defaultItem?.standardCost || 0,
        requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      }
    ]);
  };

  const handleRemoveItemLine = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setEditingPR(null);
    const seq = purchaseRequests.length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
    setPrNumber(`PR/${yearMonth}/${String(seq).padStart(3, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    if (departments.length > 0) {
      setDeptCode(departments[0].code);
      setDeptName(departments[0].name);
    }
    setRequesterName('');
    setPurpose('');
    setPriority('normal');
    setCurrency('USD');
    setNotes('');

    const defaultItem = itemStocks[0];
    setItems([
      {
        id: `pr_item_temp_${Date.now()}`,
        itemCode: defaultItem?.code || '',
        itemName: defaultItem?.name || '',
        description: '',
        qty: 10,
        uom: defaultItem?.uom || 'Pcs',
        estimatedPrice: defaultItem?.standardCost || 0,
        currency: 'USD',
        totalEstimated: (defaultItem?.standardCost || 0) * 10,
        requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      }
    ]);

    setIsModalOpen(true);
  };

  const openEditModal = (pr: PurchaseRequest) => {
    setEditingPR(pr);
    setPrNumber(pr.prNumber);
    setDate(pr.date);
    setDeptCode(pr.deptCode);
    setDeptName(pr.deptName);
    setRequesterName(pr.requesterName);
    setPurpose(pr.purpose);
    setPriority(pr.priority);
    setCurrency(pr.currency);
    setNotes(pr.notes || '');
    setItems(pr.items);
    setIsModalOpen(true);
  };

  const totalCalculated = items.reduce((sum, itm) => sum + (itm.totalEstimated || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prNumber.trim() || !deptCode || !requesterName.trim() || items.length === 0) return;

    if (editingPR) {
      onUpdatePR({
        ...editingPR,
        prNumber: prNumber.trim(),
        date,
        deptCode,
        deptName,
        requesterName: requesterName.trim(),
        purpose: purpose.trim(),
        priority,
        items,
        totalAmountEstimated: totalCalculated,
        currency,
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddPR({
        prNumber: prNumber.trim(),
        date,
        deptCode,
        deptName,
        requesterName: requesterName.trim(),
        purpose: purpose.trim(),
        priority,
        status: 'submitted',
        items,
        totalAmountEstimated: totalCalculated,
        currency,
        notes: notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">High</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Normal</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Disetujui</span>;
      case 'po_created':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><ShoppingCart className="w-3 h-3" /> PO Terbit</span>;
      case 'submitted':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Menunggu Approval</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Draft</span>;
    }
  };

  const filteredPRs = purchaseRequests.filter(pr => {
    const matchSearch =
      pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.deptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || pr.status === statusFilter;
    const matchDept = deptFilter === 'all' || pr.deptCode === deptFilter;

    return matchSearch && matchStatus && matchDept;
  });

  return (
    <div id="view-purchase-request" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Purchase Request (PR)</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Daftar permintaan pembelian barang & material dari berbagai departemen
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnCreatePR"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Purchase Request
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total PR</div>
            <div className="text-lg font-bold text-white mt-0.5">{purchaseRequests.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Menunggu Approval</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">
              {purchaseRequests.filter(p => p.status === 'submitted').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">PR Disetujui</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {purchaseRequests.filter(p => p.status === 'approved').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Sudah Jadi PO</div>
            <div className="text-lg font-bold text-indigo-300 mt-0.5">
              {purchaseRequests.filter(p => p.status === 'po_created').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor PR, dept, pemohon, barang..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Department</option>
            {departments.map(d => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="submitted">Menunggu Approval</option>
            <option value="approved">Disetujui</option>
            <option value="po_created">Sudah Jadi PO</option>
            <option value="rejected">Ditolak</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Purchase Request Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nomor PR & Tanggal</th>
                <th className="py-3.5 px-4">Department & Pemohon</th>
                <th className="py-3.5 px-4">Prioritas</th>
                <th className="py-3.5 px-4">Tujuan / Deskripsi Pengadaan</th>
                <th className="py-3.5 px-4 text-center">Jml Item</th>
                <th className="py-3.5 px-4 text-right">Estimasi Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPRs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada data Purchase Request yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPRs.map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-indigo-600">{pr.prNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{pr.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pr.deptName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Pemohon: <span className="text-slate-800 font-semibold">{pr.requesterName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getPriorityBadge(pr.priority)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs text-slate-800 font-medium truncate" title={pr.purpose}>
                        {pr.purpose}
                      </div>
                      {pr.linkedPoNumber && (
                        <div className="text-[10px] text-indigo-600 font-mono mt-0.5">
                          Linked: {pr.linkedPoNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {pr.items.length} item
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {pr.currency} {pr.totalAmountEstimated?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(pr.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailModalPR(pr)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Lihat Detail PR"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {pr.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => onApprovePR(pr.id, 'Manager / Director')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold border border-emerald-200 transition cursor-pointer"
                              title="Setujui PR"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onRejectPR(pr.id)}
                              className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold border border-rose-200 transition cursor-pointer"
                              title="Tolak PR"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {pr.status === 'approved' && onCreatePOFromPR && (
                          <button
                            onClick={() => onCreatePOFromPR(pr)}
                            className="px-2.5 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                            title="Buat Purchase Order ke Supplier"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Buat PO
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(pr)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit PR"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus Purchase Request ${pr.prNumber}?`)) {
                              onDeletePR(pr.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus PR"
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

      {/* Detail Modal */}
      {detailModalPR && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Detail {detailModalPR.prNumber}</h3>
                  <p className="text-xs text-slate-500">Departemen: {detailModalPR.deptName} ({detailModalPR.deptCode})</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalPR(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Tanggal PR</div>
                  <div className="font-semibold text-slate-800">{detailModalPR.date}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Pemohon</div>
                  <div className="font-semibold text-slate-800">{detailModalPR.requesterName}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Prioritas</div>
                  <div>{getPriorityBadge(detailModalPR.priority)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Status</div>
                  <div>{getStatusBadge(detailModalPR.status)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">Tujuan / Keperluan Pengadaan:</div>
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {detailModalPR.purpose}
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2">Daftar Barang yang Diminta:</div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Item & Spek</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Est. Harga</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3">Tgl Butuh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailModalPR.items.map((itm, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{itm.itemName}</div>
                            <div className="text-[10px] font-mono text-indigo-600">{itm.itemCode}</div>
                            {itm.description && <div className="text-[10px] text-slate-500 mt-0.5">{itm.description}</div>}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {itm.qty} {itm.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {detailModalPR.currency} {itm.estimatedPrice?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {detailModalPR.currency} {itm.totalEstimated?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 font-mono">
                            {itm.requiredDate || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right text-slate-700">Total Estimasi PR:</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700 text-sm">
                          {detailModalPR.currency} {detailModalPR.totalAmountEstimated?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {detailModalPR.notes && (
                <div className="text-xs text-slate-500">
                  Catatan: {detailModalPR.notes}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setDetailModalPR(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPR ? 'Edit Purchase Request' : 'Buat Purchase Request Baru'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor PR <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={prNumber}
                    onChange={e => setPrNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pengajuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departemen Pemohon <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deptCode}
                    onChange={e => handleDeptSelect(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pemohon (Requester) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    placeholder="Nama PIC pemohon..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang Estimasi
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="IDR">IDR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan / Justifikasi Pembelian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Pengadaan sparepart mold, kebutuhan raw material transmisi Q2, dll"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Daftar Barang yang Diajukan</span>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5 w-1/3">Pilih Item Stock / Nama</th>
                        <th className="p-2.5 w-24">Qty</th>
                        <th className="p-2.5 w-20">Satuan</th>
                        <th className="p-2.5 w-28">Est. Harga</th>
                        <th className="p-2.5 w-28 text-right">Subtotal</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((itm, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={itm.itemCode}
                              onChange={e => handleItemSelect(idx, e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              <option value="">Pilih dari Master Item Stock...</option>
                              {itemStocks.map(s => (
                                <option key={s.code} value={s.code}>
                                  {s.code} - {s.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={itm.itemName}
                              onChange={e => {
                                const val = e.target.value;
                                setItems(prev => {
                                  const copy = [...prev];
                                  copy[idx].itemName = val;
                                  return copy;
                                });
                              }}
                              placeholder="Keterangan / Deskripsi Khusus..."
                              className="w-full mt-1 p-1 text-[11px] border border-slate-200 rounded-md"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={itm.qty}
                              onChange={e => handleQtyChange(idx, Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={itm.uom}
                              onChange={e => {
                                const val = e.target.value;
                                setItems(prev => {
                                  const copy = [...prev];
                                  copy[idx].uom = val;
                                  return copy;
                                });
                              }}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={itm.estimatedPrice}
                              onChange={e => handlePriceChange(idx, Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {currency} {itm.totalEstimated?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemLine(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right font-bold text-slate-700">
                          Total Estimasi Nilai PR:
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-600 text-sm">
                          {currency} {totalCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Instruksi pengiriman, toleransi lead time, usulan vendor..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
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
                  {editingPR ? 'Simpan Perubahan' : 'Ajukan Purchase Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
