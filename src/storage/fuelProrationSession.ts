import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FuelPhotoAttachment, FuelTank, FuelType, TankOwnership } from "../models/fuelProration";

type FuelProrationSessionState = {
  tanks: FuelTank[];
  includeInStatement: boolean;
  exportFuelOnly: boolean;
  totalCredit: number;
  totalPercent: number;
  creditTo: "buyer" | "seller";
  photo?: FuelPhotoAttachment;

  fuelType?: FuelType;
  fuelCompany?: string;
  tankOwnership?: TankOwnership;
};

const STORAGE_KEY = "PROFEE_FUEL_PRORATION_SESSION";

let state: FuelProrationSessionState = {
  tanks: [],
  includeInStatement: false,
  exportFuelOnly: false,
  totalCredit: 0,
  totalPercent: 0,
  creditTo: "seller",
};

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseTanks(value: unknown): FuelTank[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((t): FuelTank | null => {
      if (!t || typeof t !== "object") return null;
      const tank = t as Record<string, unknown>;
      const id = tank.id;
      if (typeof id !== "string" || !id.trim()) return null;

      const capacityGallons = toNumber(tank.capacityGallons);
      const currentGallons = toNumber(tank.currentGallons);
      const pricePerGallon = toNumber(tank.pricePerGallon);
      const percentFullRaw = tank.percentFull;
      const percentFull = percentFullRaw == null ? undefined : toNumber(percentFullRaw);

      return {
        id,
        capacityGallons: Math.max(0, capacityGallons),
        currentGallons: Math.max(0, currentGallons),
        percentFull,
        pricePerGallon: Math.max(0, pricePerGallon),
      };
    })
    .filter((t): t is FuelTank => Boolean(t));
}

async function persist(next: FuelProrationSessionState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore persistence failures
  }
}

export async function hydrateFuelProrationSession() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<FuelProrationSessionState>;
    state = {
      ...state,
      ...parsed,
      creditTo: parsed.creditTo === "buyer" ? "buyer" : "seller",
      tanks: parseTanks((parsed as unknown as { tanks?: unknown }).tanks),
      totalCredit: Number.isFinite(parsed.totalCredit) ? (parsed.totalCredit as number) : state.totalCredit,
      totalPercent: Number.isFinite(parsed.totalPercent) ? (parsed.totalPercent as number) : state.totalPercent,
      fuelType:
        parsed.fuelType === "oil" || parsed.fuelType === "propane" || parsed.fuelType === "kerosene"
          ? parsed.fuelType
          : undefined,
      tankOwnership: parsed.tankOwnership === "owned" || parsed.tankOwnership === "leased" ? parsed.tankOwnership : undefined,
      fuelCompany: typeof parsed.fuelCompany === "string" ? parsed.fuelCompany : undefined,
    };
  } catch {
    // ignore hydration failures
  }
}

export function getFuelProrationSession(): FuelProrationSessionState {
  return state;
}

export function setFuelProrationSession(next: Partial<FuelProrationSessionState>) {
  state = { ...state, ...next };
  void persist(state);
}

export function getFuelProrationStatementAddon(): {
  fuelProrationCredit?: number;
  fuelProrationPercent?: number;
  fuelProrationCreditTo?: "buyer" | "seller";
  fuelGaugePhotoUri?: string;
  fuelType?: FuelType;
  fuelCompany?: string;
  tankOwnership?: TankOwnership;
  tanks?: { gallons: number; pricePerGallon: number }[];
} {
  if (!state.includeInStatement) return {};
  if (!Number.isFinite(state.totalCredit) || state.totalCredit <= 0) return {};

  const percent = Number.isFinite(state.totalPercent) ? Math.max(0, Math.min(100, state.totalPercent)) : 0;
  const tanks = Array.isArray(state.tanks)
    ? state.tanks
        .map((t) => {
          const gallons = Number.isFinite(t.currentGallons) ? Math.max(0, t.currentGallons) : 0;
          const pricePerGallon = Number.isFinite(t.pricePerGallon) ? Math.max(0, t.pricePerGallon) : 0;
          return { gallons, pricePerGallon };
        })
        .filter((t) => Number.isFinite(t.gallons) || Number.isFinite(t.pricePerGallon))
    : [];

  return {
    fuelProrationCredit: state.totalCredit,
    fuelProrationPercent: percent,
    fuelProrationCreditTo: state.creditTo,
    fuelGaugePhotoUri: state.photo?.uri,
    fuelType: state.fuelType,
    fuelCompany: state.fuelCompany,
    tankOwnership: state.tankOwnership,
    tanks: tanks.length > 0 ? tanks : undefined,
  };
}
