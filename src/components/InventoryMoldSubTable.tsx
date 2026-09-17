import React, { useMemo } from 'react';
import { InventoryItem } from '../types';

interface Props {
  items: InventoryItem[];
  startDate?: string;
  endDate?: string;
}

export const InventoryMoldSubTable: React.FC<Props> = ({ items, startDate, endDate }) => {
  const currentMonth = new Date();
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  const formatMonth = (d: Date) => {
    const mm = d.toLocaleString('id-ID', { month: 'short' });
    const yy = d.getFullYear().toString().slice(-2);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${lastDay}-${mm}-${yy}`;
  };

  const prevMonthStr = formatMonth(prevMonth);
  const curMonthStr = formatMonth(currentMonth);

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
      const begQty = item.beginningQty;
      const begAmt = begQty * item.unitCost;
      const purQty = item.inQty;
      const purAmt = purQty * item.unitCost;
      const retQty = 0;
      const retAmt = 0;
      const conQty = item.outQty;
      const conAmt = conQty * item.unitCost;
      const endQty = item.endingQty;
      const endAmt = endQty * item.unitCost;

      return {
        ...item,
        begQty, begAmt,
        purQty, purAmt,
        retQty, retAmt,
        conQty, conAmt,
        endQty, endAmt
      };
    });
  }, [items, startDate, endDate]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
          <thead>
            <tr className="text-black font-bold border-b border-slate-200">
              <th className="p-2 border border-slate-200 bg-[#F4B036]" rowSpan={1} colSpan={3}></th>
              <th className="p-2 border border-slate-200 text-center bg-white" colSpan={2}>{prevMonthStr}</th>
              <th className="p-2 border border-slate-200 text-center bg-[#FFEA00]" colSpan={2}>Purchase</th>
              <th className="p-2 border border-slate-200 text-center bg-[#FFEA00]" colSpan={2}>Return from Production</th>
              <th className="p-2 border border-slate-200 text-center bg-[#FFEA00]" colSpan={2}>Consumption</th>
              <th className="p-2 border border-slate-200 text-center bg-[#FFEA00]" colSpan={2}>{curMonthStr}</th>
            </tr>
            <tr className="text-black text-[11px] uppercase">
              <th className="p-1.5 border border-slate-200 bg-[#F4B036] font-normal">TOOL NAME</th>
              <th className="p-1.5 border border-slate-200 bg-[#F4B036] font-normal text-center">ID</th>
              <th className="p-1.5 border border-slate-200 bg-[#F4B036] font-normal text-center">TYPE</th>
              
              <th className="p-1.5 border border-slate-200 bg-white font-normal text-center">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-white font-normal text-center">Value in US $</th>
              
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Value in US $</th>
              
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Value in US $</th>
              
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Value in US $</th>
              
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Qty</th>
              <th className="p-1.5 border border-slate-200 bg-[#FFEA00] font-normal text-center">Value in US $</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-black">
            {data.map((row, i) => (
              <tr key={row.id} className="hover:bg-slate-50 bg-white">
                <td className="p-1.5 border border-slate-200 font-medium whitespace-nowrap uppercase">{row.name}</td>
                <td className="p-1.5 border border-slate-200 uppercase text-center">{row.itemCode}</td>
                <td className="p-1.5 border border-slate-200 uppercase text-center">{row.partNo || '-'}</td>
                
                <td className="p-1.5 border border-slate-200 text-right">{row.begQty > 0 ? row.begQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.begAmt > 0 ? row.begAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                <td className="p-1.5 border border-slate-200 text-right">{row.purQty > 0 ? row.purQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.purAmt > 0 ? row.purAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                <td className="p-1.5 border border-slate-200 text-right">{row.retQty > 0 ? row.retQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.retAmt > 0 ? row.retAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                <td className="p-1.5 border border-slate-200 text-right">{row.conQty > 0 ? row.conQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.conAmt > 0 ? row.conAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                
                <td className="p-1.5 border border-slate-200 text-right">{row.endQty > 0 ? row.endQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.endAmt > 0 ? row.endAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-slate-500 italic">Belum ada data untuk kategori ini.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
