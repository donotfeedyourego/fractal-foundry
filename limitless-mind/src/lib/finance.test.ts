import { describe, expect, it } from 'vitest';
import { compoundSeries, margins, monthlyToTarget, revenueTarget, salesTarget, ruleOf72 } from './finance';

describe('finance', () => {
  it('compounds a lump sum annually-equivalent', () => {
    const s = compoundSeries(1000, 0, 12, 1);
    expect(s.at(-1)!.value).toBeCloseTo(1000 * Math.pow(1.01, 12), 2);
  });
  it('zero rate just sums contributions', () => {
    expect(compoundSeries(0, 100, 0, 2).at(-1)!.value).toBe(2400);
  });
  it('monthlyToTarget inverts compoundSeries', () => {
    const m = monthlyToTarget(10000, 0, 6, 5);
    expect(compoundSeries(0, m, 6, 5).at(-1)!.value).toBeCloseTo(10000, 0);
    expect(monthlyToTarget(1000, 2000, 5, 1)).toBe(0);
  });
  it('margins and markup', () => {
    const r = margins(100, 60);
    expect(r.marginPct).toBe(40); expect(r.markupPct).toBeCloseTo(66.67, 1);
  });
  it('sales targets with break-even', () => {
    const r = salesTarget(1000, 50, 30, 1000)!;
    expect(r.breakEvenUnits).toBe(50); expect(r.units).toBe(100); expect(r.revenue).toBe(5000);
    expect(salesTarget(1000, 10, 20, 0)).toBeNull();
  });
  it('revenue target', () => { expect(revenueTarget(30000, 50, 20)).toBe(75000); });
  it('rule of 72', () => { expect(ruleOf72(8)).toBe(9); });
});
