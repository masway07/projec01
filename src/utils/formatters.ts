import { DeptPlanningItem, DeptPlanningSection, ExchangeRates } from '../types';

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

export function formatPlainUSD(amount: number): string {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatAmountWithCurrency(amount: number, currency: string): string {
  const n = Number(amount || 0);
  if (currency.toUpperCase() === 'USD') {
    return formatUSD(n);
  }
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
}

export function getDeptPlanningPrefix(section: DeptPlanningSection, deptCode: string): string {
  const prefix = section === 'budget' ? 'BD' : (section === 'costdown' ? 'CD' : 'PD');
  return prefix + String(deptCode || '').trim().toUpperCase();
}

export function getNextDeptPlanningCode(
  section: DeptPlanningSection,
  deptCode: string,
  existingItems: DeptPlanningItem[],
  excludeId?: string | null
): string {
  const prefix = getDeptPlanningPrefix(section, deptCode);
  let max = 0;
  existingItems.forEach(item => {
    if (excludeId && item.id === excludeId) return;
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedPrefix}-(\\d{3})$`);
    const match = String(item.code || '').match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > max) max = num;
    }
  });
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function getRateForCurrency(
  currency: string,
  year: number | string,
  ratesByYear: Record<string, ExchangeRates>
): number {
  const curr = String(currency || 'USD').toUpperCase();
  if (curr === 'USD') return 1;

  const y = String(year);
  const yearRateObj = ratesByYear[y];

  if (yearRateObj && typeof yearRateObj[curr] === 'number' && yearRateObj[curr]! > 0) {
    return yearRateObj[curr]!;
  }

  // Fallback to any configured year if available
  const allYears = Object.keys(ratesByYear);
  for (const yr of allYears) {
    if (ratesByYear[yr]?.[curr]) {
      return ratesByYear[yr][curr]!;
    }
  }

  // Safe universal fallbacks for major currencies to prevent form blockage
  const universalFallbacks: Record<string, number> = {
    IDR: 16273.56,
    JPY: 142.54,
    CNY: 0.14,
    EUR: 0.92
  };

  return universalFallbacks[curr] || 1;
}

export function calculateTotalUSD(amount: number, currency: string, rate: number): number {
  const curr = String(currency || 'USD').toUpperCase();
  const amt = Number(amount || 0);
  if (curr === 'USD') return amt;
  if (!rate || rate <= 0) return 0;
  return amt / rate;
}
