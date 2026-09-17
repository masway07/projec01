import React, { useMemo } from 'react';
import { InventoryItem } from '../types';

interface Props {
  items: InventoryItem[];
  startDate?: string;
  endDate?: string;
}

export const InventoryMoldSummaryTable: React.FC<Props> = ({ items, startDate, endDate }) => {
  const groups = [
    { code: '2RCF', name: 'CF Dies 2R (CF2R)', cat: 'Tools' },
    { code: '4RCF', name: 'CF Dies 4R (CFD4R)', cat: 'Tools' },
    { code: '2RMC', name: 'CF Machine 2R (CFM2R)', cat: 'Tools' },
    { code: '2RTL', name: 'Tools 2R', cat: 'Tools' },
    { code: '4RTL', name: 'Tools 4R', cat: 'Tools' },
    { code: 'MTEL', name: 'Electric', cat: 'Tools' },
    { code: '2RSP', name: '2R Spare Cons (2Rcon)', cat: 'Tools' },
    { code: '2RHL', name: '2R Holder Part (2RHP)', cat: 'Tools' },
    { code: '4RSP', name: '4R Spare Cons (4Rcon)', cat: 'Tools' },
    { code: '4RHL', name: '4R Holder List (4RHL)', cat: 'Tools' },
    { code: '4RHP', name: '4R Holder Part (4RHP)', cat: 'Tools' },
    { code: '4RBS', name: 'Bush', cat: 'Tools' },
    { code: 'MTMC', name: 'Mekanik (Mech)', cat: 'Tools' },
    { code: 'MTBO', name: 'Belt & Oring', cat: 'Tools' },
    { code: 'PRDW', name: 'Dowa', cat: 'Tools' },
    { code: 'PRFR', name: 'Frame', cat: 'Tools' },
    { code: 'PRSH', name: 'Shot Blast', cat: 'Tools' },
    { code: 'OIL', name: 'Oil', cat: 'Oil' },
  ];

  const summary = useMemo(() => {
    // Convert startDate and endDate to Date objects for comparison
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return groups.map(g => {
      const matching = items.filter(item => {
        const str = `${item.itemCode} ${item.partNo} ${item.name}`.toUpperCase();
        if (!str.includes(g.code)) return false;

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

      let begQty = 0, begAmt = 0;
      let purQty = 0, purAmt = 0;
      let retQty = 0, retAmt = 0;
      let conQty = 0, conAmt = 0;
      let endQty = 0, endAmt = 0;

      matching.forEach(m => {
        begQty += m.beginningQty;
        begAmt += m.beginningQty * m.unitCost;
        purQty += m.inQty;
        purAmt += m.inQty * m.unitCost;
        conQty += m.outQty;
        conAmt += m.outQty * m.unitCost;
      });

      endQty = begQty + purQty + retQty - conQty;
      endAmt = begAmt + purAmt + retAmt - conAmt;

      return {
        ...g,
        begQty, begAmt,
        purQty, purAmt,
        retQty, retAmt,
        conQty, conAmt,
        endQty, endAmt
      };
    });
  }, [items, startDate, endDate]);

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

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 mt-4">
      <div className="p-4 font-bold text-slate-800 text-lg">
        Inventory sparepart
      </div>
      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left text-[11px] border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-[#E5E7EB] text-black font-bold border border-slate-300">
              <th className="p-1 border border-slate-300 bg-white" rowSpan={2} colSpan={2}>
                <div className="flex items-center justify-between px-1">
                  <span className="w-4 h-4 bg-gray-200 rounded-sm inline-block"></span>
                  <span className="w-4 h-4 bg-gray-200 rounded-sm inline-block"></span>
                </div>
              </th>
              <th className="p-1 border border-slate-300 text-center" colSpan={2}>{prevMonthStr}</th>
              <th className="p-1 border border-slate-300 text-center" colSpan={2}>Purchase</th>
              <th className="p-1 border border-slate-300 text-center" colSpan={2}>Return from Production</th>
              <th className="p-1 border border-slate-300 text-center" colSpan={2}>Consumption</th>
              <th className="p-1 border border-slate-300 text-center" colSpan={2}>{curMonthStr}</th>
            </tr>
            <tr className="bg-[#E5E7EB] text-black font-bold">
              <th className="p-1 border border-slate-300 text-center w-24">Qty <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-28">Amount <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-24">Qty <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-28">Amount <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-24">Qty <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-28">Amount <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-24">Qty <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-28">Amount <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-24">Qty <span className="float-right text-[8px] mt-1">▼</span></th>
              <th className="p-1 border border-slate-300 text-center w-28">Amount <span className="float-right text-[8px] mt-1">▼</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-black">
            {summary.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-1 px-2 whitespace-nowrap">{row.name}</td>
                <td className="p-1 px-2">{row.cat}</td>
                <td className="p-1 px-2 text-right">{row.begQty > 0 ? row.begQty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '-'}</td>
                <td className="p-1 px-2 text-right">{row.begAmt > 0 ? row.begAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '-'}</td>
                <td className="p-1 px-2 text-right">{row.purQty > 0 ? row.purQty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1 px-2 text-right">{row.purAmt > 0 ? row.purAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1 px-2 text-right">{row.retQty > 0 ? row.retQty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1 px-2 text-right">{row.retAmt > 0 ? row.retAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1 px-2 text-right">{row.conQty > 0 ? row.conQty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1 px-2 text-right">{row.conAmt > 0 ? row.conAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1 px-2 text-right">{row.endQty > 0 ? row.endQty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '-'}</td>
                <td className="p-1 px-2 text-right">{row.endAmt > 0 ? row.endAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '-'}</td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="font-bold border-t-2 border-b-2 border-black">
              <td colSpan={2} className="p-1 px-2">Total per list</td>
              <td className="p-1 px-2 text-right">{summary.reduce((a, c) => a + c.begQty, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="p-1 px-2 text-right">{summary.reduce((a, c) => a + c.begAmt, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
            </tr>

            {/* Empty Spacer Row */}
            <tr>
              <td colSpan={12} className="h-4 bg-white border-0"></td>
            </tr>
            {/* Direct Fab cost rows */}
            <tr>
              <td colSpan={2} className="p-1 px-2">Direct Fab cost-Cons. tools</td>
              <td className="p-1 px-2 border-l-2 border-t-2 border-b border-black">
                 <div className="flex justify-between w-full"><span>$</span> <span>-</span></div>
              </td>
              <td className="p-1 px-2 border-r-2 border-t-2 border-b border-black">
                 <div className="flex justify-between w-full"><span>$</span> <span>-</span></div>
              </td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
            </tr>
            <tr>
              <td colSpan={2} className="p-1 px-2">Direct Fab cost-Fuel,Oil,Lubri</td>
              <td className="p-1 px-2 border-l-2 border-b border-black">
                <div className="flex justify-between w-full"><span>$</span> <span>-</span></div>
              </td>
              <td className="p-1 px-2 border-r-2 border-b border-black text-center"></td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
              <td className="p-1 px-2 text-center">-</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={2} className="p-1 px-2"></td>
              <td className="p-1 px-2 border-l-2 border-b-2 border-black">
                <div className="flex justify-between w-full"><span>$</span> <span>-</span></div>
              </td>
              <td className="p-1 px-2 border-r-2 border-b-2 border-black text-center"></td>
              <td className="p-1 px-2 text-right"></td>
              <td className="p-1 px-2 border-b-2 border-black">
                <div className="flex justify-between w-full"><span>$</span> <span>-</span></div>
              </td>
              <td className="p-1 px-2 text-center"></td>
              <td className="p-1 px-2 text-center"></td>
              <td className="p-1 px-2 text-center"></td>
              <td className="p-1 px-2 border-b-2 border-black">
                <div className="flex justify-between w-full"><span>$</span> <span>-</span></div>
              </td>
              <td className="p-1 px-2 text-center"></td>
              <td className="p-1 px-2 border-b-2 border-black text-center">-</td>
            </tr>
            <tr>
              <td colSpan={2}></td>
              <td className="p-1 px-2 text-center"></td>
              <td className="p-1 px-2 border-b-2 border-black text-center font-bold"></td>
              <td colSpan={8}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
