import React, { useMemo } from 'react';
import { InventoryItem, ReturnFromProdItem } from '../types';

interface Props {
  items: InventoryItem[];
  startDate?: string;
  endDate?: string;
  returnItems?: ReturnFromProdItem[];
}

export const InventoryMoldSummaryTable: React.FC<Props> = ({ items, startDate, endDate, returnItems = [] }) => {
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

  const summary = useMemo(() => {
    // Convert startDate and endDate to Date objects for comparison
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return groups.map(g => {
      const matching = items.filter(item => {
        const str = `${item.itemCode || ''} ${item.partNo || ''} ${item.name || ''}`.toUpperCase();
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
      let endQty = 0, endAmt = 0;

      matching.forEach(m => {
        const mBeg = Number(m.beginningQty) || 0;
        const mCost = Number(m.unitCost) || 0;
        begQty += mBeg;
        begAmt += mBeg * mCost;

        const mIn = Number(m.inQty) || 0;
        purQty += mIn;
        purAmt += mIn * mCost;

        // Check matching returns from production for this item
        const matchingReturns = returnItems.filter(r => {
          if (r.status === 'rejected') return false;
          const matchCode = r.itemCode && m.itemCode && r.itemCode.toUpperCase() === m.itemCode.toUpperCase();
          const matchPart = r.partNo && m.partNo && r.partNo.toUpperCase() === m.partNo.toUpperCase();
          const matchName = r.itemName && m.name && r.itemName.toUpperCase() === m.name.toUpperCase();
          return matchCode || matchPart || matchName;
        });
        const returnsQtyFromList = matchingReturns.reduce((sum, r) => sum + (Number(r.qty || r.returnedQty) || 0), 0);
        const mRet = returnsQtyFromList > 0 ? returnsQtyFromList : (Number((m as any).returnFromProdQty) || 0);
        retQty += mRet;
        retAmt += mRet * mCost;

        const mEnd = Number(m.endingQty) || 0;
        endQty += mEnd;
        endAmt += mEnd * mCost;
      });

      // Consumption = Begin balance + Purchase + Return From Prod - Ending balance
      const conQty = Math.max(0, begQty + purQty + retQty - endQty);
      const conAmt = Math.max(0, begAmt + purAmt + retAmt - endAmt);

      return {
        ...g,
        begQty, begAmt,
        purQty, purAmt,
        retQty, retAmt,
        endQty, endAmt,
        conQty, conAmt
      };
    });
  }, [items, startDate, endDate, returnItems]);

  const totals = useMemo(() => {
    return summary.reduce(
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
  }, [summary]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200 mt-4">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-base">
            Inventory Mold & Spare Part - Summary Rekonsiliasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan pergerakan stock, pembelian, pengembalian produksi, dan konsumsi per sub-group
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-indigo-700">
          Formula: <span className="font-bold">Consumption = Begin + Purchase + Return - Ending</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <table className="w-full text-left text-xs border-collapse min-w-[1280px]">
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-slate-100 text-black font-bold border border-slate-300">
              <th className="p-2 border border-slate-300 bg-white" rowSpan={1} colSpan={2}>
                <span className="uppercase tracking-wider text-[11px] text-slate-600">Sub-Group / Kategori</span>
              </th>
              <th className="p-2 border border-slate-300 text-center bg-white" colSpan={2}>
                <div className="text-slate-900 font-bold">Begin Balance</div>
                <div className="text-[10px] text-slate-500 font-normal">Stock akhir bln sebelumnya ({prevMonthStr})</div>
              </th>
              <th className="p-2 border border-slate-300 text-center bg-[#FFEA00]" colSpan={2}>
                <div className="text-slate-900 font-bold">Purchase</div>
                <div className="text-[10px] text-slate-700 font-normal">Barang masuk bln berjalan</div>
              </th>
              <th className="p-2 border border-slate-300 text-center bg-[#FFF275]" colSpan={2}>
                <div className="text-slate-900 font-bold">Return from Prod</div>
                <div className="text-[10px] text-slate-700 font-normal">Pengembalian dari produksi</div>
              </th>
              <th className="p-2 border border-slate-300 text-center bg-[#FFEA00]" colSpan={2}>
                <div className="text-slate-900 font-bold">Ending Balance</div>
                <div className="text-[10px] text-slate-700 font-normal">Stock akhir bln berjalan ({curMonthStr})</div>
              </th>
              <th className="p-2 border border-slate-300 text-center bg-[#FFE082]" colSpan={2}>
                <div className="text-slate-900 font-bold">Consumption</div>
                <div className="text-[10px] text-slate-700 font-normal">Nilai: (Begin + Pur + Ret - End)</div>
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="bg-slate-50 text-black text-[11px] font-bold border border-slate-300">
              <th className="p-1.5 border border-slate-300 font-semibold text-slate-700">Item Group</th>
              <th className="p-1.5 border border-slate-300 font-semibold text-slate-700 w-20 text-center">Category</th>
              
              {/* Begin Balance */}
              <th className="p-1.5 border border-slate-300 text-center w-20">Qty</th>
              <th className="p-1.5 border border-slate-300 text-center w-28">Amount ($)</th>
              
              {/* Purchase */}
              <th className="p-1.5 border border-slate-300 text-center w-20 bg-[#FFF9C4]">Qty</th>
              <th className="p-1.5 border border-slate-300 text-center w-28 bg-[#FFF9C4]">Amount ($)</th>
              
              {/* Return from Prod */}
              <th className="p-1.5 border border-slate-300 text-center w-20 bg-[#FFFDE7]">Qty</th>
              <th className="p-1.5 border border-slate-300 text-center w-28 bg-[#FFFDE7]">Amount ($)</th>

              {/* Ending Balance */}
              <th className="p-1.5 border border-slate-300 text-center w-20 bg-[#FFF9C4]">Qty</th>
              <th className="p-1.5 border border-slate-300 text-center w-28 bg-[#FFF9C4]">Amount ($)</th>

              {/* Consumption */}
              <th className="p-1.5 border border-slate-300 text-center w-20 bg-[#FFE57F]">Qty</th>
              <th className="p-1.5 border border-slate-300 text-center w-28 bg-[#FFE57F]">Amount ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-black">
            {summary.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-1.5 px-2.5 font-medium whitespace-nowrap border border-slate-200">
                  <span className="font-mono text-slate-500 mr-2 text-[10px] font-bold">{row.code}</span>
                  {row.name}
                </td>
                <td className="p-1.5 px-2 text-center border border-slate-200 text-slate-600 text-[11px]">{row.cat}</td>
                
                {/* Begin Balance */}
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono">
                  {row.begQty > 0 ? row.begQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </td>
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono">
                  {row.begAmt > 0 ? `$${row.begAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>

                {/* Purchase */}
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono bg-yellow-50/20">
                  {row.purQty > 0 ? row.purQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </td>
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono bg-yellow-50/20">
                  {row.purAmt > 0 ? `$${row.purAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>

                {/* Return from Prod */}
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono text-blue-700 bg-blue-50/20">
                  {row.retQty > 0 ? row.retQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </td>
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono text-blue-700 bg-blue-50/20">
                  {row.retAmt > 0 ? `$${row.retAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>

                {/* Ending Balance */}
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono font-bold bg-yellow-50/30">
                  {row.endQty > 0 ? row.endQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </td>
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono font-bold bg-yellow-50/30">
                  {row.endAmt > 0 ? `$${row.endAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>

                {/* Consumption */}
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono font-bold text-amber-900 bg-amber-50/50">
                  {row.conQty > 0 ? row.conQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </td>
                <td className="p-1.5 px-2 text-right border border-slate-200 font-mono font-bold text-amber-900 bg-amber-50/50">
                  {row.conAmt > 0 ? `$${row.conAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Totals Row */}
          <tfoot>
            <tr className="font-bold border-t-2 border-b-2 border-slate-400 bg-slate-100 text-black text-xs">
              <td colSpan={2} className="p-2 px-3 border border-slate-300 uppercase tracking-wide">
                Total Keseluruhan (Summary)
              </td>
              
              {/* Begin Balance Totals */}
              <td className="p-2 px-2 text-right border border-slate-300 font-mono">
                {totals.begQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 px-2 text-right border border-slate-300 font-mono">
                ${totals.begAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>

              {/* Purchase Totals */}
              <td className="p-2 px-2 text-right border border-slate-300 font-mono bg-yellow-100/30">
                {totals.purQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 px-2 text-right border border-slate-300 font-mono bg-yellow-100/30">
                ${totals.purAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>

              {/* Return from Prod Totals */}
              <td className="p-2 px-2 text-right border border-slate-300 font-mono text-blue-700 bg-blue-100/30">
                {totals.retQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 px-2 text-right border border-slate-300 font-mono text-blue-700 bg-blue-100/30">
                ${totals.retAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>

              {/* Ending Balance Totals */}
              <td className="p-2 px-2 text-right border border-slate-300 font-mono bg-yellow-100/40">
                {totals.endQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 px-2 text-right border border-slate-300 font-mono bg-yellow-100/40">
                ${totals.endAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>

              {/* Consumption Totals */}
              <td className="p-2 px-2 text-right border border-slate-300 font-mono text-amber-900 bg-amber-100/60">
                {totals.conQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-2 px-2 text-right border border-slate-300 font-mono text-amber-900 bg-amber-100/60">
                ${totals.conAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
