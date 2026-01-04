type FuelProrationSessionState = {
  includeInStatement: boolean;
  sendFuelOnly: boolean;
  totalCredit: number;
  totalPercent: number;
};

let state: FuelProrationSessionState = {
  includeInStatement: false,
  sendFuelOnly: false,
  totalCredit: 0,
  totalPercent: 0,
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
} {
  if (!state.includeInStatement) return {};
  if (!Number.isFinite(state.totalCredit) || state.totalCredit <= 0) return {};

  const percent = Number.isFinite(state.totalPercent) ? Math.max(0, Math.min(100, state.totalPercent)) : 0;

  return {
    fuelProrationCredit: state.totalCredit,
    fuelProrationPercent: percent,
  };
}
