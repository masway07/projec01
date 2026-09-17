import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  FileCheck2,
  Truck,
  Building,
  DollarSign,
  Layers,
  ArrowRight,
  Eye,
  X,
  Sparkles,
  Star,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, Supplier, ItemStock, PurchaseRequest, ItemStockSupplier } from '../types';

interface PurchaseOrderViewProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  itemStocks: ItemStock[];
  purchaseRequests?: PurchaseRequest[];
  onAddPO: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
  onMarkStatusPO: (id: string, status: PurchaseOrder['status']) => void;
}

export const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({
  purchaseOrders,
  suppliers,
  itemStocks,
  purchaseRequests = [],
  onAddPO,
  onUpdatePO,
  onDeletePO,
  onMarkStatusPO
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  // Form states
  const [poNumber, setPoNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [prNumber, setPrNumber] = useState('');
  const [supplierCode, setSupplierCode] = useState(suppliers[0]?.code || '');
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || '');
  const [supplierAddress, setSupplierAddress] = useState(suppliers[0]?.address || '');
  const [supplierContact, setSupplierContact] = useState(suppliers[0]?.contactPerson || '');
  const [supplierEmail, setSupplierEmail] = useState(suppliers[0]?.email || '');
  const [supplierPhone, setSupplierPhone] = useState(suppliers[0]?.phone || '');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState(suppliers[0]?.paymentTerms || 'NET 30');
  const [currency, setCurrency] = useState(suppliers[0]?.currency || 'USD');
  const [rate, setRate] = useState<number>(16273.56);
  const [taxPercent, setTaxPercent] = useState<number>(11);
  const [deliveryAddress, setDeliveryAddress] = useState('Kawasan Industri GIIC Blok C-1, Cikarang Pusat, Bekasi - Loading Dock Receiving');
  const [notes, setNotes] = useState('');

  // Stock & Supplier Search State
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockTypeFilter, setStockTypeFilter] = useState<string>('all');
  const [showStockSupplierPanel, setShowStockSupplierPanel] = useState(true);
  const [poActionToast, setPoActionToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Helper to resolve suppliers connected to an item stock
  const getItemSuppliers = (item: ItemStock): ItemStockSupplier[] => {
    if (item.suppliers && item.suppliers.length > 0) {
      return item.suppliers;
    }
    // Fallback if none defined: return first suppliers from master with default cost
    return suppliers.slice(0, 2).map((s, idx) => ({
      supplierId: s.id,
      supplierCode: s.code,
      supplierName: s.name,
      price: item.standardCost || (s.currency === 'IDR' ? 25000 : 1.5),
      currency: s.currency || 'USD',
      leadTimeDays: idx === 0 ? 7 : 14,
      isPrimary: idx === 0,
      notes: idx === 0 ? 'Katalog Reguler' : 'Katalog Sekunder'
    }));
  };

  // Filter items and their linked suppliers based on search keyword & stock type
  const filteredStockWithSuppliers = useMemo(() => {
    return itemStocks
      .filter(item => {
        const q = stockSearchTerm.trim().toLowerCase();
        const matchType = stockTypeFilter === 'all' || item.category === stockTypeFilter;
        if (!q) return matchType;

        const inCode = item.code.toLowerCase().includes(q);
        const inName = item.name.toLowerCase().includes(q);
        const inCat = item.category.toLowerCase().includes(q);
        const inUom = item.uom.toLowerCase().includes(q);
        const inSup = (item.suppliers || []).some(
          s => s.supplierName.toLowerCase().includes(q) || s.supplierCode.toLowerCase().includes(q)
        );

        return (inCode || inName || inCat || inUom || inSup) && matchType;
      })
      .map(item => ({
        ...item,
        availableSuppliers: getItemSuppliers(item)
      }));
  }, [itemStocks, stockSearchTerm, stockTypeFilter, suppliers]);

  // Select supplier and populate/append item to PO line
  const handleSelectSupplierAndItem = (item: ItemStock, supLink: ItemStockSupplier) => {
    // 1. Select the supplier if different or empty
    const isDifferentSupplier = supplierCode !== supLink.supplierCode;
    if (isDifferentSupplier) {
      handleSupplierSelect(supLink.supplierCode);
      if (supLink.currency) {
        setCurrency(supLink.currency);
      }
    }

    const priceToUse = supLink.price !== undefined && supLink.price > 0 ? supLink.price : (item.standardCost || 0);

    // 2. Add or update the item in PO lines
    setItems(prev => {
      // If only one line exists and it's default/unmodified
      const isFirstRowPlaceholder =
        prev.length === 1 &&
        (!prev[0].itemCode || (prev[0].itemCode === itemStocks[0]?.code && prev[0].qty === 1 && (!prev[0].description || prev[0].description === '')));

      if (isFirstRowPlaceholder) {
        return [
          {
            id: `po_item_${Date.now()}`,
            itemCode: item.code,
            itemName: item.name,
            description: supLink.notes ? `Spek: ${supLink.notes}` : '',
            qty: 10,
            uom: item.uom,
            unitPrice: priceToUse,
            totalPrice: priceToUse * 10
          }
        ];
      }

      // If item already exists in PO lines
      const existingIdx = prev.findIndex(p => p.itemCode === item.code);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          unitPrice: priceToUse,
          totalPrice: copy[existingIdx].qty * priceToUse,
          description: supLink.notes ? `Spek: ${supLink.notes}` : copy[existingIdx].description
        };
        return copy;
      }

      // Append new item line
      return [
        ...prev,
        {
          id: `po_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          itemCode: item.code,
          itemName: item.name,
          description: supLink.notes ? `Spek: ${supLink.notes}` : '',
          qty: 10,
          uom: item.uom,
          unitPrice: priceToUse,
          totalPrice: priceToUse * 10
        }
      ];
    });

    setPoActionToast({
      message: `Supplier "${supLink.supplierName}" dipilih & item "${item.name}" (${item.code}) dimasukkan ke pesanan PO! Harga: ${supLink.currency === 'IDR' ? 'Rp ' : '$'}${priceToUse.toLocaleString()}`
    });

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].qty = qty;
      copy[index].totalPrice = qty * (copy[index].unitPrice || 0);
      return copy;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].unitPrice = price;
      copy[index].totalPrice = (copy[index].qty || 0) * price;
      return copy;
    });
  };

  const handleAddItemLine = () => {
    const defaultItem = itemStocks[0];
    setItems(prev => [
      ...prev,
      {
        id: `po_item_temp_${Date.now()}`,
        itemCode: defaultItem?.code || '',
        itemName: defaultItem?.name || '',
        description: '',
        qty: 1,
        uom: defaultItem?.uom || 'Pcs',
        unitPrice: defaultItem?.standardCost || 0,
        totalPrice: defaultItem?.standardCost || 0
      }
    ]);
  };

  const handleRemoveItemLine = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, itm) => sum + (itm.totalPrice || 0), 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = subtotal + taxAmount;
  const grandTotalUSD = currency === 'USD' ? grandTotal : grandTotal / (rate || 16273.56);

  const openAddModal = () => {
    setEditingPO(null);
    const seq = purchaseOrders.length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
    setPoNumber(`PO/${yearMonth}/${String(seq).padStart(3, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setPrNumber('');
    setStockSearchTerm('');
    setShowStockSupplierPanel(true);
    setPoActionToast(null);

    if (suppliers.length > 0) {
      handleSupplierSelect(suppliers[0].code);
    }
    setDeliveryDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setTaxPercent(11);
    setNotes('');

    const defaultItem = itemStocks[0];
    setItems([
      {
        id: `po_item_temp_${Date.now()}`,
        itemCode: defaultItem?.code || '',
        itemName: defaultItem?.name || '',
        description: '',
        qty: 10,
        uom: defaultItem?.uom || 'Pcs',
        unitPrice: defaultItem?.standardCost || 0,
        totalPrice: (defaultItem?.standardCost || 0) * 10
      }
    ]);

    setIsModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoNumber(po.poNumber);
    setDate(po.date);
    setPrNumber(po.prNumber || '');
    setSupplierCode(po.supplierCode);
    setSupplierName(po.supplierName);
    setSupplierAddress(po.supplierAddress || '');
    setSupplierContact(po.supplierContact || '');
    setSupplierEmail(po.supplierEmail || '');
    setSupplierPhone(po.supplierPhone || '');
    setDeliveryDate(po.deliveryDate);
    setPaymentTerms(po.paymentTerms);
    setCurrency(po.currency);
    setRate(po.rate || 16273.56);
    setTaxPercent(po.taxPercent || 0);
    setDeliveryAddress(po.deliveryAddress || '');
    setNotes(po.notes || '');
    setItems(po.items);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim() || !supplierCode || items.length === 0) return;

    if (editingPO) {
      onUpdatePO({
        ...editingPO,
        poNumber: poNumber.trim(),
        date,
        prNumber: prNumber.trim() || undefined,
        supplierCode,
        supplierName,
        supplierAddress,
        supplierContact,
        supplierEmail,
        supplierPhone,
        deliveryDate,
        paymentTerms,
        currency,
        rate,
        items,
        subtotal,
        taxPercent,
        taxAmount,
        grandTotal,
        grandTotalUSD,
        deliveryAddress,
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddPO({
        poNumber: poNumber.trim(),
        date,
        prNumber: prNumber.trim() || undefined,
        supplierCode,
        supplierName,
        supplierAddress,
        supplierContact,
        supplierEmail,
        supplierPhone,
        deliveryDate,
        paymentTerms,
        currency,
        rate,
        items,
        subtotal,
        taxPercent,
        taxAmount,
        grandTotal,
        grandTotalUSD,
        status: 'draft',
        deliveryAddress,
        notes: notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'sent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Send className="w-3 h-3" /> Terkirim ke Supplier</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"><FileCheck2 className="w-3 h-3" /> Konfirmasi Vendor</span>;
      case 'received':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Truck className="w-3 h-3" /> Barang Diterima</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Selesai / Lunas</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Dibatalkan</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Draft PO</span>;
    }
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.prNumber && po.prNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      po.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchSup = supplierFilter === 'all' || po.supplierCode === supplierFilter;

    return matchSearch && matchStatus && matchSup;
  });

  return (
    <div id="view-purchase-order" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Purchase Order (PO)</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Penerbitan surat pesanan resmi kepada supplier dan monitoring penerimaan barang
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnCreatePO"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Purchase Order
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total PO Terbit</div>
            <div className="text-lg font-bold text-white mt-0.5">{purchaseOrders.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">PO Terkirim ke Vendor</div>
            <div className="text-lg font-bold text-blue-300 mt-0.5">
              {purchaseOrders.filter(p => p.status === 'sent').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Barang Sudah Diterima</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">
              {purchaseOrders.filter(p => p.status === 'received').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total Nilai PO (USD)</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              ${purchaseOrders.reduce((acc, p) => acc + (p.grandTotalUSD || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            placeholder="Cari nomor PO, supplier, PR..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Terkirim ke Supplier</option>
            <option value="confirmed">Dikonfirmasi Vendor</option>
            <option value="received">Barang Diterima</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Purchase Order Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nomor PO & Tanggal</th>
                <th className="py-3.5 px-4">Nama Supplier</th>
                <th className="py-3.5 px-4">Ref. PR</th>
                <th className="py-3.5 px-4">Jadwal Kirim</th>
                <th className="py-3.5 px-4 text-right">Grand Total ({currency})</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada data Purchase Order yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-indigo-600">{po.poNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{po.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{po.supplierName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        PIC: {po.supplierContact || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-700">
                      {po.prNumber || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {po.deliveryDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900 text-sm">
                        {po.currency} {po.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {po.paymentTerms}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewPO(po)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Lihat / Cetak Form PO"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {po.status === 'draft' && (
                          <button
                            onClick={() => onMarkStatusPO(po.id, 'sent')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1"
                            title="Kirim PO ke Supplier"
                          >
                            <Send className="w-3 h-3" />
                            Kirim
                          </button>
                        )}

                        {po.status === 'sent' && (
                          <button
                            onClick={() => onMarkStatusPO(po.id, 'received')}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200 transition cursor-pointer flex items-center gap-1"
                            title="Tandai Barang Diterima di Gudang"
                          >
                            <Truck className="w-3 h-3" />
                            Terima
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(po)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit PO"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus Purchase Order ${po.poNumber}?`)) {
                              onDeletePO(po.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus PO"
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

      {/* PO Printable Preview Modal */}
      {previewPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Purchase Order Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak PO
                </button>
                <button
                  onClick={() => setPreviewPO(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official PO Header */}
            <div className="mt-6 border border-slate-300 rounded-xl p-6 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">PT SMARTBUDGET MANUFACTURING</h1>
                  <p className="text-xs text-slate-600 mt-0.5">Kawasan Industri Cikarang, Blok C-1, Jawa Barat</p>
                  <p className="text-xs text-slate-500">Telp: +62 21 8900 1234 | Email: procurement@smartbudget.co.id</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-indigo-700 font-mono tracking-wider">PURCHASE ORDER</div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">{previewPO.poNumber}</div>
                  <div className="text-xs text-slate-500">Tanggal: {previewPO.date}</div>
                </div>
              </div>

              {/* Vendor & Shipping Details */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Kepada Supplier (Vendor):</div>
                  <div className="font-bold text-slate-900 mt-1">{previewPO.supplierName}</div>
                  <div className="text-slate-600 mt-0.5">{previewPO.supplierAddress}</div>
                  <div className="text-slate-500 mt-1">
                    PIC: <span className="font-semibold text-slate-700">{previewPO.supplierContact}</span> ({previewPO.supplierPhone})
                  </div>
                  <div className="text-slate-500">{previewPO.supplierEmail}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Alamat Pengiriman & Ketentuan:</div>
                  <div className="text-slate-700 font-medium mt-1">{previewPO.deliveryAddress}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px]">Tgl Pengiriman:</span>
                      <div className="font-bold text-slate-900">{previewPO.deliveryDate}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Termin Bayar:</span>
                      <div className="font-bold text-slate-900">{previewPO.paymentTerms}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Kode & Nama Barang</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan ({previewPO.currency})</th>
                      <th className="py-2.5 px-3 text-right">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewPO.items.map((itm, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{itm.itemName}</div>
                          <div className="text-[10px] font-mono text-indigo-600">{itm.itemCode}</div>
                          {itm.description && <div className="text-[10px] text-slate-500">{itm.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{itm.qty}</td>
                        <td className="py-2.5 px-3 text-slate-700">{itm.uom}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {itm.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {itm.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="py-2 px-3 text-right text-slate-600">Subtotal:</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        {previewPO.currency} {previewPO.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="py-2 px-3 text-right text-slate-600">PPN ({previewPO.taxPercent || 0}%):</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        {previewPO.currency} {previewPO.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-300 text-sm">
                      <td colSpan={5} className="py-2.5 px-3 text-right text-indigo-900 font-extrabold">Grand Total:</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-700">
                        {previewPO.currency} {previewPO.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {previewPO.notes && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Catatan Pesanan: </span>
                  {previewPO.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="text-slate-500 mb-14">Diterima & Dikonfirmasi Vendor:</div>
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <div className="font-bold text-slate-800 mt-1">{previewPO.supplierName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-14">Hormat Kami (Procurement Dept):</div>
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <div className="font-bold text-slate-800 mt-1">PT SMARTBUDGET MANUFACTURING</div>
                </div>
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
                  <ShoppingCart className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPO ? 'Edit Purchase Order' : 'Penerbitan Purchase Order Baru'}
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
                    Nomor PO <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal PO <span className="text-rose-500">*</span>
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
                    Ref. Nomor PR (Opsional)
                  </label>
                  <input
                    type="text"
                    value={prNumber}
                    onChange={e => setPrNumber(e.target.value)}
                    placeholder="PR/2026/03/001"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Supplier (Vendor) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={supplierCode}
                    onChange={e => handleSupplierSelect(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jadwal Kirim (Delivery Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Termin Pembayaran
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    placeholder="NET 30, NET 45, dll"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang Transaksi
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PPN Pajak (%)
                  </label>
                  <select
                    value={taxPercent}
                    onChange={e => setTaxPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value={0}>0% (Bebas PPN / Kawasan Berikat)</option>
                    <option value={11}>11% (PPN Standar)</option>
                    <option value={12}>12% (PPN Terkini)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurs IDR per Valas
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={e => setRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Pengiriman (Delivery Destination)
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Daftar Barang yang Dipesan</span>
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
                        <th className="p-2.5 w-1/3">Item Stock / Barang</th>
                        <th className="p-2.5 w-24">Qty</th>
                        <th className="p-2.5 w-20">Satuan</th>
                        <th className="p-2.5 w-28">Harga Satuan</th>
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
                              placeholder="Keterangan spesifikasi..."
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
                              value={itm.unitPrice}
                              onChange={e => handlePriceChange(idx, Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {currency} {itm.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <tfoot className="bg-slate-50 border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">Subtotal:</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">PPN ({taxPercent}%):</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-t border-slate-300">
                        <td colSpan={4} className="p-2.5 text-right font-bold text-indigo-900">Grand Total PO:</td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-indigo-700 text-sm">
                          {currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan untuk Supplier
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Kualifikasi pengepakan, mill certificate, ketentuan penagihan invoice..."
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
                  {editingPO ? 'Simpan Perubahan PO' : 'Terbitkan Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

  // Items
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      id: 'po_item_temp_1',
      itemCode: itemStocks[0]?.code || '',
      itemName: itemStocks[0]?.name || '',
      description: '',
      qty: 1,
      uom: itemStocks[0]?.uom || 'Pcs',
      unitPrice: itemStocks[0]?.standardCost || 0,
      totalPrice: itemStocks[0]?.standardCost || 0
    }
  ]);

  const handleSupplierSelect = (code: string) => {
    setSupplierCode(code);
    const sup = suppliers.find(s => s.code === code);
    if (sup) {
      setSupplierName(sup.name);
      setSupplierAddress(sup.address ? `${sup.address}, ${sup.city}` : sup.city);
      setSupplierContact(sup.contactPerson || '');
      setSupplierEmail(sup.email || '');
      setSupplierPhone(sup.phone || '');
      setPaymentTerms(sup.paymentTerms || 'NET 30');
      setCurrency(sup.currency || 'USD');
    }
  };

  const handleItemSelect = (index: number, code: string) => {
    const selected = itemStocks.find(i => i.code === code);
    setItems(prev => {
      const copy = [...prev];
      if (selected) {
        // If the current PO supplier is linked to this item, use that supplier's price!
        const supMatch = selected.suppliers?.find(s => s.supplierCode === supplierCode);
        const unitPrice = supMatch?.price !== undefined ? supMatch.price : selected.standardCost;

        copy[index] = {
          ...copy[index],
          itemCode: selected.code,
          itemName: selected.name,
          uom: selected.uom,
          unitPrice: unitPrice,
          totalPrice: (unitPrice || 0) * (copy[index].qty || 1)
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
      copy[index].totalPrice = qty * (copy[index].unitPrice || 0);
      return copy;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].unitPrice = price;
      copy[index].totalPrice = (copy[index].qty || 0) * price;
      return copy;
    });
  };

  const handleAddItemLine = () => {
    const defaultItem = itemStocks[0];
    setItems(prev => [
      ...prev,
      {
        id: `po_item_temp_${Date.now()}`,
        itemCode: defaultItem?.code || '',
        itemName: defaultItem?.name || '',
        description: '',
        qty: 1,
        uom: defaultItem?.uom || 'Pcs',
        unitPrice: defaultItem?.standardCost || 0,
        totalPrice: defaultItem?.standardCost || 0
      }
    ]);
  };

  const handleRemoveItemLine = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, itm) => sum + (itm.totalPrice || 0), 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = subtotal + taxAmount;
  const grandTotalUSD = currency === 'USD' ? grandTotal : grandTotal / (rate || 16273.56);

  const openAddModal = () => {
    setEditingPO(null);
    const seq = purchaseOrders.length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
    setPoNumber(`PO/${yearMonth}/${String(seq).padStart(3, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setPrNumber('');

    if (suppliers.length > 0) {
      handleSupplierSelect(suppliers[0].code);
    }
    setDeliveryDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setTaxPercent(11);
    setNotes('');

    const defaultItem = itemStocks[0];
    setItems([
      {
        id: `po_item_temp_${Date.now()}`,
        itemCode: defaultItem?.code || '',
        itemName: defaultItem?.name || '',
        description: '',
        qty: 10,
        uom: defaultItem?.uom || 'Pcs',
        unitPrice: defaultItem?.standardCost || 0,
        totalPrice: (defaultItem?.standardCost || 0) * 10
      }
    ]);

    setIsModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoNumber(po.poNumber);
    setDate(po.date);
    setPrNumber(po.prNumber || '');
    setSupplierCode(po.supplierCode);
    setSupplierName(po.supplierName);
    setSupplierAddress(po.supplierAddress || '');
    setSupplierContact(po.supplierContact || '');
    setSupplierEmail(po.supplierEmail || '');
    setSupplierPhone(po.supplierPhone || '');
    setDeliveryDate(po.deliveryDate);
    setPaymentTerms(po.paymentTerms);
    setCurrency(po.currency);
    setRate(po.rate || 16273.56);
    setTaxPercent(po.taxPercent || 0);
    setDeliveryAddress(po.deliveryAddress || '');
    setNotes(po.notes || '');
    setItems(po.items);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim() || !supplierCode || items.length === 0) return;

    if (editingPO) {
      onUpdatePO({
        ...editingPO,
        poNumber: poNumber.trim(),
        date,
        prNumber: prNumber.trim() || undefined,
        supplierCode,
        supplierName,
        supplierAddress,
        supplierContact,
        supplierEmail,
        supplierPhone,
        deliveryDate,
        paymentTerms,
        currency,
        rate,
        items,
        subtotal,
        taxPercent,
        taxAmount,
        grandTotal,
        grandTotalUSD,
        deliveryAddress,
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddPO({
        poNumber: poNumber.trim(),
        date,
        prNumber: prNumber.trim() || undefined,
        supplierCode,
        supplierName,
        supplierAddress,
        supplierContact,
        supplierEmail,
        supplierPhone,
        deliveryDate,
        paymentTerms,
        currency,
        rate,
        items,
        subtotal,
        taxPercent,
        taxAmount,
        grandTotal,
        grandTotalUSD,
        status: 'draft',
        deliveryAddress,
        notes: notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'sent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Send className="w-3 h-3" /> Terkirim ke Supplier</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"><FileCheck2 className="w-3 h-3" /> Konfirmasi Vendor</span>;
      case 'received':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Truck className="w-3 h-3" /> Barang Diterima</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Selesai / Lunas</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Dibatalkan</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Draft PO</span>;
    }
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.prNumber && po.prNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      po.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchSup = supplierFilter === 'all' || po.supplierCode === supplierFilter;

    return matchSearch && matchStatus && matchSup;
  });

  return (
    <div id="view-purchase-order" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Purchase Order (PO)</h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Penerbitan surat pesanan resmi kepada supplier dan monitoring penerimaan barang
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnCreatePO"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Purchase Order
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total PO Terbit</div>
            <div className="text-lg font-bold text-white mt-0.5">{purchaseOrders.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">PO Terkirim ke Vendor</div>
            <div className="text-lg font-bold text-blue-300 mt-0.5">
              {purchaseOrders.filter(p => p.status === 'sent').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Barang Sudah Diterima</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">
              {purchaseOrders.filter(p => p.status === 'received').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-slate-400 text-[11px] font-medium">Total Nilai PO (USD)</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              ${purchaseOrders.reduce((acc, p) => acc + (p.grandTotalUSD || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            placeholder="Cari nomor PO, supplier, PR..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Terkirim ke Supplier</option>
            <option value="confirmed">Dikonfirmasi Vendor</option>
            <option value="received">Barang Diterima</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Purchase Order Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nomor PO & Tanggal</th>
                <th className="py-3.5 px-4">Nama Supplier</th>
                <th className="py-3.5 px-4">Ref. PR</th>
                <th className="py-3.5 px-4">Jadwal Kirim</th>
                <th className="py-3.5 px-4 text-right">Grand Total ({currency})</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada data Purchase Order yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-indigo-600">{po.poNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{po.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{po.supplierName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        PIC: {po.supplierContact || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-700">
                      {po.prNumber || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {po.deliveryDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900 text-sm">
                        {po.currency} {po.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {po.paymentTerms}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewPO(po)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Lihat / Cetak Form PO"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {po.status === 'draft' && (
                          <button
                            onClick={() => onMarkStatusPO(po.id, 'sent')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1"
                            title="Kirim PO ke Supplier"
                          >
                            <Send className="w-3 h-3" />
                            Kirim
                          </button>
                        )}

                        {po.status === 'sent' && (
                          <button
                            onClick={() => onMarkStatusPO(po.id, 'received')}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200 transition cursor-pointer flex items-center gap-1"
                            title="Tandai Barang Diterima di Gudang"
                          >
                            <Truck className="w-3 h-3" />
                            Terima
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(po)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit PO"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus Purchase Order ${po.poNumber}?`)) {
                              onDeletePO(po.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus PO"
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

      {/* PO Printable Preview Modal */}
      {previewPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Purchase Order Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak PO
                </button>
                <button
                  onClick={() => setPreviewPO(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official PO Header */}
            <div className="mt-6 border border-slate-300 rounded-xl p-6 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">PT SMARTBUDGET MANUFACTURING</h1>
                  <p className="text-xs text-slate-600 mt-0.5">Kawasan Industri Cikarang, Blok C-1, Jawa Barat</p>
                  <p className="text-xs text-slate-500">Telp: +62 21 8900 1234 | Email: procurement@smartbudget.co.id</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-indigo-700 font-mono tracking-wider">PURCHASE ORDER</div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">{previewPO.poNumber}</div>
                  <div className="text-xs text-slate-500">Tanggal: {previewPO.date}</div>
                </div>
              </div>

              {/* Vendor & Shipping Details */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Kepada Supplier (Vendor):</div>
                  <div className="font-bold text-slate-900 mt-1">{previewPO.supplierName}</div>
                  <div className="text-slate-600 mt-0.5">{previewPO.supplierAddress}</div>
                  <div className="text-slate-500 mt-1">
                    PIC: <span className="font-semibold text-slate-700">{previewPO.supplierContact}</span> ({previewPO.supplierPhone})
                  </div>
                  <div className="text-slate-500">{previewPO.supplierEmail}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Alamat Pengiriman & Ketentuan:</div>
                  <div className="text-slate-700 font-medium mt-1">{previewPO.deliveryAddress}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px]">Tgl Pengiriman:</span>
                      <div className="font-bold text-slate-900">{previewPO.deliveryDate}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Termin Bayar:</span>
                      <div className="font-bold text-slate-900">{previewPO.paymentTerms}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Kode & Nama Barang</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan ({previewPO.currency})</th>
                      <th className="py-2.5 px-3 text-right">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewPO.items.map((itm, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{itm.itemName}</div>
                          <div className="text-[10px] font-mono text-indigo-600">{itm.itemCode}</div>
                          {itm.description && <div className="text-[10px] text-slate-500">{itm.description}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">{itm.qty}</td>
                        <td className="py-2.5 px-3 text-slate-700">{itm.uom}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {itm.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {itm.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="py-2 px-3 text-right text-slate-600">Subtotal:</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        {previewPO.currency} {previewPO.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="py-2 px-3 text-right text-slate-600">PPN ({previewPO.taxPercent || 0}%):</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        {previewPO.currency} {previewPO.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-300 text-sm">
                      <td colSpan={5} className="py-2.5 px-3 text-right text-indigo-900 font-extrabold">Grand Total:</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-700">
                        {previewPO.currency} {previewPO.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {previewPO.notes && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Catatan Pesanan: </span>
                  {previewPO.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="text-slate-500 mb-14">Diterima & Dikonfirmasi Vendor:</div>
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <div className="font-bold text-slate-800 mt-1">{previewPO.supplierName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-14">Hormat Kami (Procurement Dept):</div>
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <div className="font-bold text-slate-800 mt-1">PT SMARTBUDGET MANUFACTURING</div>
                </div>
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
                  <ShoppingCart className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPO ? 'Edit Purchase Order' : 'Penerbitan Purchase Order Baru'}
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
                    Nomor PO <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal PO <span className="text-rose-500">*</span>
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
                    Ref. Nomor PR (Opsional)
                  </label>
                  <input
                    type="text"
                    value={prNumber}
                    onChange={e => setPrNumber(e.target.value)}
                    placeholder="PR/2026/03/001"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Supplier (Vendor) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={supplierCode}
                    onChange={e => handleSupplierSelect(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jadwal Kirim (Delivery Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Termin Pembayaran
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    placeholder="NET 30, NET 45, dll"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Uang Transaksi
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PPN Pajak (%)
                  </label>
                  <select
                    value={taxPercent}
                    onChange={e => setTaxPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value={0}>0% (Bebas PPN / Kawasan Berikat)</option>
                    <option value={11}>11% (PPN Standar)</option>
                    <option value={12}>12% (PPN Terkini)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurs IDR per Valas
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={e => setRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Pengiriman (Delivery Destination)
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Daftar Barang yang Dipesan</span>
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
                        <th className="p-2.5 w-1/3">Item Stock / Barang</th>
                        <th className="p-2.5 w-24">Qty</th>
                        <th className="p-2.5 w-20">Satuan</th>
                        <th className="p-2.5 w-28">Harga Satuan</th>
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
                              placeholder="Keterangan spesifikasi..."
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
                              value={itm.unitPrice}
                              onChange={e => handlePriceChange(idx, Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {currency} {itm.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <tfoot className="bg-slate-50 border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">Subtotal:</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">PPN ({taxPercent}%):</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-t border-slate-300">
                        <td colSpan={4} className="p-2.5 text-right font-bold text-indigo-900">Grand Total PO:</td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-indigo-700 text-sm">
                          {currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan untuk Supplier
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Kualifikasi pengepakan, mill certificate, ketentuan penagihan invoice..."
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
                  {editingPO ? 'Simpan Perubahan PO' : 'Terbitkan Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
