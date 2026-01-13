import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FuelPhotoAttachment } from "../models/fuelProration";

type FuelProrationSessionState = {
  includeInStatement: boolean;
  exportFuelOnly: boolean;
  totalCredit: number;
  totalPercent: number;
  creditTo: "buyer" | "seller";
  photo?: FuelPhotoAttachment;
};

const STORAGE_KEY = "PROFEE_FUEL_PRORATION_SESSION";

let state: FuelProrationSessionState = {
  includeInStatement: false,
  exportFuelOnly: false,
  totalCredit: 0,
  totalPercent: 0,
  creditTo: "seller",
};

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
      totalCredit: Number.isFinite(parsed.totalCredit) ? (parsed.totalCredit as number) : state.totalCredit,
      totalPercent: Number.isFinite(parsed.totalPercent) ? (parsed.totalPercent as number) : state.totalPercent,
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
} {
  if (!state.includeInStatement) return {};
  if (!Number.isFinite(state.totalCredit) || state.totalCredit <= 0) return {};

  const percent = Number.isFinite(state.totalPercent) ? Math.max(0, Math.min(100, state.totalPercent)) : 0;

  return {
    fuelProrationCredit: state.totalCredit,
    fuelProrationPercent: percent,
    fuelProrationCreditTo: state.creditTo,
  };
}
