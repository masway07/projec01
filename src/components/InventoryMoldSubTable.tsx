import React, { useMemo } from 'react';
import { InventoryItem, ReturnFromProdItem } from '../types';

interface Props {
  items: InventoryItem[];
  startDate?: string;
  endDate?: string;
  returnItems?: ReturnFromProdItem[];
}

export const InventoryMoldSubTable: React.FC<Props> = ({ items, startDate, endDate, returnItems = [] }) => {
  const currentMonth = new Date();
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  const formatMonth = (d: Date) => {
    const mm = d.toLocaleString('id-ID', { month: 'short' });
    const yy = d.getFullYear().toString().slice(-2);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${lastDay}-${mm}-${yy}`;
  };

  const formatCustomDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const mm = d.toLocaleString('id-ID', { month: 'short' });
    const yy = d.getFullYear().toString().slice(-2);
    const dd = d.getDate().toString().padStart(2, '0');
    return `${dd}-${mm}-${yy}`;
  };

  const prevMonthStr = startDate ? formatCustomDate(startDate) : formatMonth(prevMonth);
  const curMonthStr = endDate ? formatCustomDate(endDate) : formatMonth(currentMonth);

  const data = useMemo(() => {
    // Convert startDate and endDate to Date objects for comparison
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filteredItems = items.filter(item => {
      if (start || end) {
        const itemDateStr = item.updatedAt || item.createdAt;
        if (itemDateStr) {
          const itemDate = new Date(itemDateStr);
          if (start && itemDate < start) return false;
          if (end && itemDate > end) return false;
        }
      }
      return true;
    });

    return filteredItems.map(item => {
      const begQty = Number(item.beginningQty) || 0;
      const begAmt = begQty * (Number(item.unitCost) || 0);

      const purQty = Number(item.inQty) || 0;
      const purAmt = purQty * (Number(item.unitCost) || 0);

      // Return from Production
      const matchingReturns = returnItems.filter(r => {
        if (r.status === 'rejected') return false;
        const matchCode = r.itemCode && item.itemCode && r.itemCode.toUpperCase() === item.itemCode.toUpperCase();
        const matchPart = r.partNo && item.partNo && r.partNo.toUpperCase() === item.partNo.toUpperCase();
        const matchName = r.itemName && item.name && r.itemName.toUpperCase() === item.name.toUpperCase();
        return matchCode || matchPart || matchName;
      });
      const returnsQtyFromList = matchingReturns.reduce((sum, r) => sum + (Number(r.qty || r.returnedQty) || 0), 0);
      const retQty = returnsQtyFromList > 0 ? returnsQtyFromList : (Number((item as any).returnFromProdQty) || 0);
      const retAmt = retQty * (Number(item.unitCost) || 0);

      const endQty = Number(item.endingQty) || 0;
      const endAmt = endQty * (Number(item.unitCost) || 0);

      // Consumption = Begin balance + Purchase + Return From Prod - Ending balance
      const conQty = Math.max(0, begQty + purQty + retQty - endQty);
      const conAmt = conQty * (Number(item.unitCost) || 0);

      return {
        ...item,
        begQty, begAmt,
        purQty, purAmt,
        retQty, retAmt,
        endQty, endAmt,
        conQty, conAmt
      };
    });
  }, [items, startDate, endDate, returnItems]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => ({
        begQty: acc.begQty + r.begQty,
        begAmt: acc.begAmt + r.begAmt,
        purQty: acc.purQty + r.purQty,
        purAmt: acc.purAmt + r.purAmt,
        retQty: acc.retQty + r.retQty,
        retAmt: acc.retAmt + r.retAmt,
        endQty: acc.endQty + r.endQty,
        endAmt: acc.endAmt + r.endAmt,
        conQty: acc.conQty + r.conQty,
        conAmt: acc.conAmt + r.conAmt
      }),
      {
        begQty: 0, begAmt: 0,
        purQty: 0, purAmt: 0,
        retQty: 0, retAmt: 0,
        endQty: 0, endAmt: 0,
        conQty: 0, conAmt: 0
      }
    );
  }, [data]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs mt-4">
      {/* Information Banner */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Formula Rekonsiliasi Mold & Spare Part:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-semibold text-[11px]">
            Consumption = Begin Balance + Purchase + Return from Prod - Ending Balance
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Menampilkan {data.length} item tooling / sparepart
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
          <thead>
            {/* Top Level Category Headers */}
            <tr className="text-black font-bold border-b border-slate-200 text-xs">
              <th className="p-2.5 border border-slate-200 bg-[#F4B036]" colSpan={3}>
                <span className="uppercase tracking-wider font-bold">Informasi Tooling / Spare Part</span>
              </th>
              <th className="p-2.5 border border-slate-200 text-center bg-white" colSpan={2}>
                <div className="font-bold text-slate-900">Begin Balance</div>
                <div className="text-[10px] text-slate-500 font-normal">Stock akhir bln sebelumnya ({prevMonthStr})</div>
              </th>
              <th className="p-2.5 border border-slate-200 text-center bg-[#FFEA00]" colSpan={2}>
                <div className="font-bold text-slate-900">Purchase</div>
                <div className="text-[10px] text-slate-700 font-normal">Barang masuk bln berjalan</div>
              </th>
              <th className="p-2.5 border border-slate-200 text-center bg-[#FFF275]" colSpan={2}>
                <div className="font-bold text-slate-900">Return from Prod</div>
                <div className="text-[10px] text-slate-700 font-normal">Pengembalian dari produksi</div>
              </th>
              <th className="p-2.5 border border-slate-200 text-center bg-[#FFEA00]" colSpan={2}>
                <div className="font-bold text-slate-900">Ending Balance</div>
                <div className="text-[10px] text-slate-700 font-normal">Stock akhir bln berjalan ({curMonthStr})</div>
              </th>
              <th className="p-2.5 border border-slate-200 text-center bg-[#FFE082]" colSpan={2}>
                <div className="font-bold text-slate-900">Consumption</div>
                <div className="text-[10px] text-slate-700 font-normal">Nilai: (Begin + Pur + Ret - End)</div>
              </th>
            </tr>

            {/* Sub-headers for Qty and Value */}
            <tr className="text-black text-[11px] uppercase">
              <th className="p-1.5 border border-slate-200 bg-[#F4B036] font-semibold">TOOL NAME</th>
              <th className="p-1.5 border border-slate-200 bg-[#F4B036] font-semibold text-center w-24">ID</th>
              <th className="p-1.5 border border-slate-200 bg-[#F4B036] font-semibold text-center w-28">TYPE / PART NO</th>
              
              {/* Begin Balance */}
              <th className="p-1.5 border border-slate-200 bg-white font-medium text-center w-20">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-white font-medium text-center w-28">Value in US $</th>
              
              {/* Purchase */}
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-medium text-center w-20">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-medium text-center w-28">Value in US $</th>
              
              {/* Return from Production */}
              <th className="p-1.5 border border-slate-200 bg-[#FFF275] font-medium text-center w-20">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFF275] font-medium text-center w-28">Value in US $</th>

              {/* Ending Balance */}
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-medium text-center w-20">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-medium text-center w-28">Value in US $</th>
              
              {/* Consumption */}
              <th className="p-1.5 border border-slate-200 bg-[#FFE082] font-medium text-center w-20">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFE082] font-medium text-center w-28">Value in US $</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-black">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 bg-white">
                <td className="p-1.5 px-2 border border-slate-200 font-medium whitespace-nowrap uppercase">{row.name}</td>
                <td className="p-1.5 border border-slate-200 uppercase text-center font-mono font-bold text-slate-800">{row.itemCode}</td>
                <td className="p-1.5 border border-slate-200 uppercase text-center text-slate-600">{row.partNo || '-'}</td>
                
                {/* Begin Balance */}
                <td className="p-1.5 border border-slate-200 text-right font-mono">{row.begQty > 0 ? row.begQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right font-mono">{row.begAmt > 0 ? row.begAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                {/* Purchase */}
                <td className="p-1.5 border border-slate-200 text-right font-mono">{row.purQty > 0 ? row.purQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right font-mono">{row.purAmt > 0 ? row.purAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                {/* Return from Prod */}
                <td className="p-1.5 border border-slate-200 text-right font-mono text-blue-700">{row.retQty > 0 ? row.retQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right font-mono text-blue-700">{row.retAmt > 0 ? row.retAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                {/* Ending Balance */}
                <td className="p-1.5 border border-slate-200 text-right font-mono font-bold">{row.endQty > 0 ? row.endQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right font-mono font-bold">{row.endAmt > 0 ? row.endAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>

                {/* Consumption */}
                <td className="p-1.5 border border-slate-200 text-right font-mono font-bold text-amber-900 bg-amber-50/40">{row.conQty > 0 ? row.conQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right font-mono font-bold text-amber-900 bg-amber-50/40">{row.conAmt > 0 ? row.conAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-slate-500 italic">Belum ada data untuk kategori ini.</td>
              </tr>
            )}
          </tbody>

          {/* Table Footer: Totals */}
          {data.length > 0 && (
            <tfoot>
              <tr className="font-bold border-t-2 border-slate-300 bg-slate-100 text-black text-xs">
                <td colSpan={3} className="p-2 px-3 border border-slate-200 uppercase tracking-wide">
                  Total Keseluruhan
                </td>
                
                {/* Begin Balance Totals */}
                <td className="p-2 border border-slate-200 text-right font-mono">{totals.begQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-2 border border-slate-200 text-right font-mono">${totals.begAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                {/* Purchase Totals */}
                <td className="p-2 border border-slate-200 text-right font-mono">{totals.purQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-2 border border-slate-200 text-right font-mono">${totals.purAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                {/* Return from Prod Totals */}
                <td className="p-2 border border-slate-200 text-right font-mono text-blue-700">{totals.retQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-2 border border-slate-200 text-right font-mono text-blue-700">${totals.retAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                {/* Ending Balance Totals */}
                <td className="p-2 border border-slate-200 text-right font-mono">{totals.endQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-2 border border-slate-200 text-right font-mono">${totals.endAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                {/* Consumption Totals */}
                <td className="p-2 border border-slate-200 text-right font-mono text-amber-900 bg-amber-100/50">{totals.conQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-2 border border-slate-200 text-right font-mono text-amber-900 bg-amber-100/50">${totals.conAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
