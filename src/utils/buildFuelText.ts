export type FuelProrationSummary = {
  totalCredit: number;
  totalPercent: number;
};

export function buildFuelProrationText(fuel: FuelProrationSummary): string {
  const percent = Number.isFinite(fuel.totalPercent) ? Math.round(fuel.totalPercent) : 0;
  const credit = Number.isFinite(fuel.totalCredit) ? fuel.totalCredit : 0;

  return `Fuel Proration Summary

Fuel Level: ${percent}%
Total Fuel Credit: $${credit.toFixed(2)}

Prepared by ProFee`;
}
