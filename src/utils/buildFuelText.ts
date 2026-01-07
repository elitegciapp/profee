export type FuelProrationSummary = {
  totalCredit: number;
  totalPercent: number;
  creditTo?: "buyer" | "seller";
};

export function buildFuelProrationText(fuel: FuelProrationSummary): string {
  const percent = Number.isFinite(fuel.totalPercent) ? Math.round(fuel.totalPercent) : 0;
  const credit = Number.isFinite(fuel.totalCredit) ? fuel.totalCredit : 0;
  const creditedTo = fuel.creditTo === "buyer" ? "Buyer" : "Seller";

  return `Fuel Proration Summary

Fuel Level: ${percent}%
Total Fuel Credit: $${credit.toFixed(2)}
Credited to: ${creditedTo}

Prepared by ProFee`;
}
