export type FuelProrationSummary = {
  totalCredit: number;
  totalPercent: number;
  creditTo?: "buyer" | "seller";
  fuelType?: "oil" | "propane" | "kerosene";
  fuelCompany?: string;
  tankOwnership?: "owned" | "leased";
  gaugePhotoUri?: string;
};

function fuelTypeLabel(value?: FuelProrationSummary["fuelType"]) {
  if (value === "oil") return "Oil";
  if (value === "propane") return "Propane";
  if (value === "kerosene") return "Kerosene";
  return "—";
}

function tankOwnershipLabel(value?: FuelProrationSummary["tankOwnership"]) {
  if (value === "owned") return "Owned";
  if (value === "leased") return "Leased";
  return "—";
}

export function buildFuelProrationText(fuel: FuelProrationSummary): string {
  const percent = Number.isFinite(fuel.totalPercent) ? Math.round(fuel.totalPercent) : 0;
  const credit = Number.isFinite(fuel.totalCredit) ? fuel.totalCredit : 0;
  const creditedTo = fuel.creditTo === "buyer" ? "Buyer" : "Seller";
  const fuelCompany = fuel.fuelCompany?.trim() || "—";

  return `Fuel Proration Summary

Fuel Type: ${fuelTypeLabel(fuel.fuelType)}
Fuel Company: ${fuelCompany}
Tank Ownership: ${tankOwnershipLabel(fuel.tankOwnership)}

Fuel Level: ${percent}%
Total Fuel Credit: $${credit.toFixed(2)}
Credited to: ${creditedTo}

Prepared by ProFee`;
}
