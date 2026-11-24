/** Pure financial calculations (unit-tested in finance.test.ts). */

/** Future value with monthly contributions, compounded monthly. Contributions at end of month. */
export function compoundSeries(principal: number, monthly: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12;
  const rows: { year: number; contributed: number; value: number }[] = [];
  let value = principal, contributed = principal;
  rows.push({ year: 0, contributed, value });
  for (let m = 1; m <= Math.round(years * 12); m++) {
    value = value * (1 + r) + monthly;
    contributed += monthly;
    if (m % 12 === 0) rows.push({ year: m / 12, contributed: round2(contributed), value: round2(value) });
  }
  return rows;
}

/** Monthly saving required to reach `target` in `years` from `current`, at an annual return. */
export function monthlyToTarget(target: number, current: number, annualRatePct: number, years: number) {
  const n = Math.round(years * 12); if (n <= 0) return Math.max(0, target - current);
  const r = annualRatePct / 100 / 12;
  const fvCurrent = current * Math.pow(1 + r, n);
  const need = target - fvCurrent;
  if (need <= 0) return 0;
  return r === 0 ? need / n : (need * r) / (Math.pow(1 + r, n) - 1);
}

export function margins(price: number, unitCost: number) {
  const profit = price - unitCost;
  return { profit, marginPct: price ? (profit / price) * 100 : 0, markupPct: unitCost ? (profit / unitCost) * 100 : 0 };
}

/** Units and revenue required to cover fixed costs and hit a profit goal. */
export function salesTarget(fixedCosts: number, price: number, variableCost: number, profitGoal: number) {
  const contribution = price - variableCost;
  if (contribution <= 0) return null;
  const breakEvenUnits = Math.ceil(fixedCosts / contribution);
  const units = Math.ceil((fixedCosts + profitGoal) / contribution);
  return { contribution, breakEvenUnits, units, revenue: units * price };
}

export function revenueTarget(incomeGoal: number, marginPct: number, taxPct: number) {
  const afterTax = 1 - taxPct / 100; const m = marginPct / 100;
  if (afterTax <= 0 || m <= 0) return null;
  return incomeGoal / afterTax / m;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const ruleOf72 = (ratePct: number) => (ratePct > 0 ? 72 / ratePct : Infinity);
