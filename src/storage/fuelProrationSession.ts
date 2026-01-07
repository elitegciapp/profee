type FuelProrationSessionState = {
  includeInStatement: boolean;
  exportFuelOnly: boolean;
  totalCredit: number;
  totalPercent: number;
  creditTo: "buyer" | "seller";
};

let state: FuelProrationSessionState = {
  includeInStatement: false,
  exportFuelOnly: false,
  totalCredit: 0,
  totalPercent: 0,
  creditTo: "seller",
};

export function getFuelProrationSession(): FuelProrationSessionState {
  return state;
}

export function setFuelProrationSession(next: Partial<FuelProrationSessionState>) {
  state = { ...state, ...next };
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
