import type { FuelTank } from "../models/fuelProration";

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Locale-tolerant decimal parsing:
 * - Accepts "3.27" and "3,27"
 * - Handles thousands separators when both '.' and ',' appear
 * - Empty/partial input returns 0 (safe for live editing)
 */
export function parseDecimalInput(text: string): number {
  const raw = text.trim().replace(/\s/g, "");
  if (raw === "") return 0;

  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");

  let normalized = raw;

  if (lastDot !== -1 && lastComma !== -1) {
    const decimalIsDot = lastDot > lastComma;
    const decimalSep = decimalIsDot ? "." : ",";
    const thousandsSep = decimalIsDot ? "," : ".";

    normalized = normalized.split(thousandsSep).join("");
    normalized = normalized.replace(decimalSep, ".");
  } else if (lastComma !== -1 && lastDot === -1) {
    normalized = normalized.replace(",", ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function calculateTankCredit(gallons: number, pricePerGallon: number): number {
  if (!Number.isFinite(gallons) || !Number.isFinite(pricePerGallon)) {
    return 0;
  }

  const safeGallons = Math.max(0, gallons);
  const safePrice = Math.max(0, pricePerGallon);
  return safeGallons * safePrice;
}

export function calculateFuelProration(tanks: FuelTank[]) {
  const tankResults = tanks.map((tank) => {
    const percent = tank.percentFull;
    const effectiveGallons =
      percent == null
        ? tank.currentGallons
        : (Math.max(0, tank.capacityGallons) * clamp(percent, 0, 100)) / 100;

    const credit = calculateTankCredit(effectiveGallons, tank.pricePerGallon);
    return { ...tank, effectiveGallons, credit };
  });

  const totalCredit = tankResults.reduce((sum, t) => sum + t.credit, 0);

  return { tankResults, totalCredit };
}
