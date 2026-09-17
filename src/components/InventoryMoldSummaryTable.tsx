import React, { useMemo } from 'react';
import { InventoryItem } from '../types';

interface Props {
  items: InventoryItem[];
}

export const InventoryMoldSummaryTable: React.FC<Props> = ({ items }) => {
  // We need to group items by the 18 specific categories.
  // The categories correspond to the `location` or maybe we parse it from `partNo`?
  // Let's just group by the new 18 sub-menus. The activeGroupId is basically `2RCF`, `4RCF`, etc.
  
  // The groups are:
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
    { code: '4RBS', name: 'Bush1', cat: 'Tools' },
    { code: 'MTMC', name: 'Mekanik (Mech)', cat: 'Tools' },
    { code: 'MTBO', name: 'Belt & Oring', cat: 'Tools' },
    { code: 'PRDW', name: 'Dowa', cat: 'Tools' },
    { code: 'PRFR', name: 'Frame', cat: 'Tools' },
    { code: 'PRSH', name: 'Shot Blast', cat: 'Tools' },
    { code: 'OIL', name: 'Oil', cat: 'Oil' },
  ];

  const summary = useMemo(() => {
    return groups.map(g => {
      // Find items that match this group.
      // Assuming itemCode or partNo starts with the code, OR we added subCategory field to InventoryItem.
      // Since we just added it, `item.subCategory` might not exist yet in db.
      // We can check item.itemCode.includes(g.code) or item.partNo.includes(g.code)
      const matching = items.filter(item => {
        const str = `${item.itemCode} ${item.partNo} ${item.name}`.toUpperCase();
        return str.includes(g.code);
      });

      let begQty = 0, begAmt = 0;
      let purQty = 0, purAmt = 0;
      let retQty = 0, retAmt = 0; // Assuming 0 for now as we don't track returns from prod
      let conQty = 0, conAmt = 0;
      let endQty = 0, endAmt = 0;

      matching.forEach(m => {
        begQty += m.beginningQty;
        begAmt += m.beginningQty * m.unitCost;
        purQty += m.inQty; // Assuming all inQty is purchase
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
  }, [items]);

  const currentMonth = new Date();
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  const formatMonth = (d: Date) => {
    const mm = d.toLocaleString('id-ID', { month: 'short' });
    const yy = d.getFullYear().toString().slice(-2);
    // e.g. 31-Des-24
    // get last day of month
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${lastDay}-${mm}-${yy}`;
  };

  const prevMonthStr = formatMonth(prevMonth);
  const curMonthStr = formatMonth(currentMonth);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
        Inventory sparepart
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-2 border border-slate-200 text-center" rowSpan={2} colSpan={2}>
                Category
              </th>
              <th className="p-2 border border-slate-200 text-center" colSpan={2}>{prevMonthStr}</th>
              <th className="p-2 border border-slate-200 text-center bg-blue-50 text-blue-800" colSpan={2}>Purchase</th>
              <th className="p-2 border border-slate-200 text-center bg-orange-50 text-orange-800" colSpan={2}>Return from Production</th>
              <th className="p-2 border border-slate-200 text-center bg-rose-50 text-rose-800" colSpan={2}>Consumption</th>
              <th className="p-2 border border-slate-200 text-center bg-emerald-50 text-emerald-800" colSpan={2}>{curMonthStr}</th>
            </tr>
            <tr className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
              <th className="p-1.5 border border-slate-200 text-right">Qty</th>
              <th className="p-1.5 border border-slate-200 text-right">Amount</th>
              <th className="p-1.5 border border-slate-200 text-right bg-blue-50">Qty</th>
              <th className="p-1.5 border border-slate-200 text-right bg-blue-50">Amount</th>
              <th className="p-1.5 border border-slate-200 text-right bg-orange-50">Qty</th>
              <th className="p-1.5 border border-slate-200 text-right bg-orange-50">Amount</th>
              <th className="p-1.5 border border-slate-200 text-right bg-rose-50">Qty</th>
              <th className="p-1.5 border border-slate-200 text-right bg-rose-50">Amount</th>
              <th className="p-1.5 border border-slate-200 text-right bg-emerald-50">Qty</th>
              <th className="p-1.5 border border-slate-200 text-right bg-emerald-50">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {summary.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-1.5 border border-slate-200 font-medium whitespace-nowrap">{row.name}</td>
                <td className="p-1.5 border border-slate-200 text-slate-500">{row.cat}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.begQty.toLocaleString()}</td>
                <td className="p-1.5 border border-slate-200 text-right">${row.begAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.purQty > 0 ? row.purQty.toLocaleString() : ''}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.purAmt > 0 ? row.purAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.retQty > 0 ? row.retQty.toLocaleString() : ''}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.retAmt > 0 ? row.retAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.conQty > 0 ? row.conQty.toLocaleString() : ''}</td>
                <td className="p-1.5 border border-slate-200 text-right">{row.conAmt > 0 ? row.conAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : ''}</td>
                <td className="p-1.5 border border-slate-200 text-right font-bold">{row.endQty.toLocaleString()}</td>
                <td className="p-1.5 border border-slate-200 text-right font-bold">${row.endAmt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold">
            <tr>
              <td colSpan={2} className="p-2 border border-slate-200 text-right">Total per list</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.begQty, 0).toLocaleString()}</td>
              <td className="p-2 border border-slate-200 text-right">${summary.reduce((a, c) => a + c.begAmt, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.purQty, 0) || '-'}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.purAmt, 0) ? '$' + summary.reduce((a, c) => a + c.purAmt, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.retQty, 0) || '-'}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.retAmt, 0) ? '$' + summary.reduce((a, c) => a + c.retAmt, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.conQty, 0) || '-'}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.conAmt, 0) ? '$' + summary.reduce((a, c) => a + c.conAmt, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
              <td className="p-2 border border-slate-200 text-right">{summary.reduce((a, c) => a + c.endQty, 0).toLocaleString()}</td>
              <td className="p-2 border border-slate-200 text-right">${summary.reduce((a, c) => a + c.endAmt, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
