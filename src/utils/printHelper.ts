import { BudgetRealization, CompanySettings, DeptPlanningItem, MonthlyDistribution } from '../types';
import { DP_MONTHS } from '../constants/defaultData';

export interface BudgetUsagePrintData {
  item: BudgetRealization;
  deptDisplay: string;
  year: number;
  accountNo: string;
  accountName: string;
  monthName: string;
  budgetTahun: number;
  budgetBulan: number;
  sisaBudgetTahunSetelah: number;
  sisaBudgetBulanSetelah: number;
  companyName: string;
  companyAddress: string;
  logoUrl: string;
  printDateStr: string;
}

export function computeBudgetUsagePrintData(
  realization: BudgetRealization,
  budgetItems: DeptPlanningItem[],
  allRealizations: BudgetRealization[],
  companySettings?: CompanySettings,
  deptName?: string
): BudgetUsagePrintData {
  const year = realization.year;
  const deptCode = (realization.deptCode || '').toUpperCase();
  const accountNo = realization.accountNo || '';
  const monthKey = realization.month || 'Jan';

  // 1. Calculate Budget Tahun and Budget Bulan after Cost Down for this account & dept
  let totalBudgetYTD = 0;
  let totalCostDownYTD = 0;
  let monthlyBudgetVal = 0;
  let monthlyCostDownVal = 0;

  budgetItems.forEach(b => {
    if (b.year === year && (b.deptCode || '').toUpperCase() === deptCode && b.accountNo === accountNo) {
      const yearlySum = DP_MONTHS.reduce<number>((s, m) => s + (Number(b.monthly?.[m as keyof MonthlyDistribution]) || 0), 0);
      const totalAmount = yearlySum > 0 ? yearlySum : (Number(b.totalUSD) || 0);

      const mVal = Number(b.monthly?.[monthKey as keyof MonthlyDistribution]) || 0;

      if (b.section === 'budget') {
        totalBudgetYTD += totalAmount;
        monthlyBudgetVal += mVal;
      } else if (b.section === 'costdown') {
        totalCostDownYTD += totalAmount;
        monthlyCostDownVal += mVal;
      }
    }
  });

  const budgetTahun = totalBudgetYTD - totalCostDownYTD;
  const budgetBulan = monthlyBudgetVal - monthlyCostDownVal;

  // 2. Calculate cumulative realization for this account up to and including this transaction
  // Find all realizations for same dept, account, year
  const relevantRealizations = allRealizations.filter(
    r => r.year === year && (r.deptCode || '').toUpperCase() === deptCode && r.accountNo === accountNo
  );

  // Sort by date ascending
  relevantRealizations.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  let cumulativeYearUSD = 0;
  let cumulativeMonthUSD = 0;

  for (const r of relevantRealizations) {
    // Only count up to current transaction (or date <= current transaction date)
    const isPastOrCurrent = r.date < realization.date || (r.date === realization.date && r.id === realization.id);
    if (isPastOrCurrent) {
      cumulativeYearUSD += Number(r.priceUSD) || 0;
      if (r.month === monthKey) {
        cumulativeMonthUSD += Number(r.priceUSD) || 0;
      }
    }
  }

  // If current realization wasn't found in list (e.g. previewing new), include it
  const isIncluded = relevantRealizations.some(r => r.id === realization.id);
  if (!isIncluded) {
    cumulativeYearUSD += Number(realization.priceUSD) || 0;
    cumulativeMonthUSD += Number(realization.priceUSD) || 0;
  }

  const sisaBudgetTahunSetelah = budgetTahun - cumulativeYearUSD;
  const sisaBudgetBulanSetelah = budgetBulan - cumulativeMonthUSD;

  const deptDisplay = deptName ? `${realization.deptCode} - ${deptName}` : realization.deptCode;
  const companyName = companySettings?.companyName || 'PT. KANETA INDONESIA';
  const companyAddress =
    companySettings?.address || 'Jl. Maligi VI, Sukaluyu, Telukjambe Timur, Karawang, Jawa Barat 41361';
  const logoUrl =
    companySettings?.logoUrl ||
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsqDiO61u49dXdSR9zGyM9cvmPJOS3-Qj1Q82Md0oVIC6JTDVK0tOnW2iK&s=10';

  const now = new Date();
  const printDateStr = `${now.toLocaleDateString('id-ID')}, ${now.toLocaleTimeString('id-ID').replace(/:/g, '.')}`;

  return {
    item: realization,
    deptDisplay,
    year,
    accountNo,
    accountName: realization.accountName || '-',
    monthName: monthKey,
    budgetTahun,
    budgetBulan,
    sisaBudgetTahunSetelah,
    sisaBudgetBulanSetelah,
    companyName,
    companyAddress,
    logoUrl,
    printDateStr
  };
}

export function formatCurrencyVal(val: number): string {
  if (Math.abs(val) < 0.0001) return '$0.00';
  if (val < 0) {
    return `-$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatOriginalAmount(val: number): string {
  return Number(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export function generateBudgetUsagePrintHtml(data: BudgetUsagePrintData): string {
  const {
    item,
    deptDisplay,
    year,
    accountNo,
    accountName,
    monthName,
    budgetTahun,
    budgetBulan,
    sisaBudgetTahunSetelah,
    sisaBudgetBulanSetelah,
    companyName,
    companyAddress,
    logoUrl,
    printDateStr
  } = data;

  const budgetTahunStr = formatCurrencyVal(budgetTahun);
  const budgetBulanStr = formatCurrencyVal(budgetBulan);
  const sisaBudgetTahunStr = formatCurrencyVal(sisaBudgetTahunSetelah);
  const sisaBudgetBulanStr = formatCurrencyVal(sisaBudgetBulanSetelah);
  const hargaOriginalStr = `${item.currency} ${formatOriginalAmount(item.price)}`;
  const hargaUSDStr = formatCurrencyVal(item.priceUSD);

  return `<!DOCTYPE html>
<html><head>
      <title>Penggunaan Budget - ${escapeHtml(item.name)}</title>
      <meta charset="utf-8">
      <style>
        @page{size:A4 portrait;margin:12mm}
        body{font:11px Arial,sans-serif;color:#111;margin:0;padding:0}
        .header{text-align:center}
        .header img{max-height:50px;max-width:160px;object-fit:contain}
        h1{font-size:17px;margin:2px 0}
        h2{font-size:14px;margin:3px 0}
        .top{display:grid;grid-template-columns:1fr;gap:8px;margin:8px 0}
        .box{border:1px solid #111;padding:6px;line-height:1.4}
        table{border-collapse:collapse;width:100%;margin-top:7px}
        th,td{border:1px solid #111;padding:4px}
        th{background:#eee}
        .right{text-align:right}
        .yellow{background:#fff900}
        .green{background:#92d050;font-weight:700}
        .small{font-size:9px}
        .approval{margin-top:30px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;width:100%}
        .approval > div{border:1px solid #111;min-height:135px;padding:6px 5px;text-align:center;display:flex;flex-direction:column}
        .approval .status{font-weight:400;min-height:20px}
        .approval .sign-space{flex:1;min-height:82px;border:0}
        .approval .position{font-weight:400;padding-top:5px;min-height:22px;border:0}
        .approval > div > div{border:0}
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${escapeHtml(logoUrl)}" alt="Logo" onerror="this.style.display='none'"><br>
        <h1>${escapeHtml(companyName)}</h1>
        <div>${escapeHtml(companyAddress)}</div>
        <h2>FORM PENGGUNAAN / REALISASI BUDGET</h2>
      </div>

      <div class="top">
        <div class="box">
          <b>Department:</b> ${escapeHtml(deptDisplay)}<br>
          <b>Tahun:</b> ${year}<br>
          <b>No Akun:</b> ${escapeHtml(accountNo)}<br>
          <b>Nama Akun:</b> ${escapeHtml(accountName)}
        </div>
        <div class="box">
          <b>Budget Tahun:</b> ${budgetTahunStr}<br>
          <b>Budget ${escapeHtml(monthName)}:</b> ${budgetBulanStr}<br>
          <b>Sisa Budget Tahun Setelah Transaksi:</b> ${sisaBudgetTahunStr}<br>
          <b>Sisa Budget Bulan Setelah Transaksi:</b> ${sisaBudgetBulanStr}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tgl</th>
            <th>Nama</th>
            <th>Type</th>
            <th>Alasan</th>
            <th>Harga</th>
            <th>Harga USD</th>
            <th>Sisa Budget (Bulan)</th>
            <th>Sisa Budget (Tahun)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(item.date || '')}</td>
            <td>${escapeHtml(item.name || '')}</td>
            <td>${escapeHtml(item.type || '')}</td>
            <td>${escapeHtml(item.reason || '')}</td>
            <td class="right">${escapeHtml(hargaOriginalStr)}</td>
            <td class="right">${escapeHtml(hargaUSDStr)}</td>
            <td class="right">${escapeHtml(sisaBudgetBulanStr)}</td>
            <td class="right">${escapeHtml(sisaBudgetTahunStr)}</td>
          </tr>
        </tbody>
      </table>

      <div class="approval">
        <div><div class="status">Approved</div><div class="sign-space"></div><div class="position">General Manager</div></div>
        <div><div class="status">Approved</div><div class="sign-space"></div><div class="position">Manager</div></div>
        <div><div class="status">Check</div><div class="sign-space"></div><div class="position">SV</div></div>
        <div><div class="status">Buat</div><div class="sign-space"></div><div class="position">PIC</div></div>
      </div>

      <div style="margin-top:10px;text-align:right" class="small">
        Dicetak: ${escapeHtml(printDateStr)}
      </div>

      <script>
        window.onload=function(){
          setTimeout(function(){window.print()},300);
        };
      </script>
    </body></html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function printHtmlViaIframe(htmlContent: string) {
  // 1. Try hidden iframe printing (optimal for sandboxed/web views)
  try {
    const existingIframe = document.getElementById('print-virtual-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-virtual-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Error invoking print on iframe:', e);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe print failed, attempting popup fallback...', err);
  }

  // 2. Fallback to window.open if iframe is blocked
  try {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
  } catch (e) {
    console.error('Print popup error:', e);
  }
}
