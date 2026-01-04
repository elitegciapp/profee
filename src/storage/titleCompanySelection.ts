import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TitleCompany } from "../models/titleCompany";

function selectionKey(statementId: string) {
  return `PROFEE_TITLE_COMPANY_SELECTION_${statementId}`;
}

export async function setTitleCompanySelectionForStatement(statementId: string, company: TitleCompany) {
  await AsyncStorage.setItem(selectionKey(statementId), JSON.stringify(company));
}

export async function consumeTitleCompanySelectionForStatement(
  statementId: string
): Promise<TitleCompany | null> {
  const key = selectionKey(statementId);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  await AsyncStorage.removeItem(key);
  try {
    return JSON.parse(raw) as TitleCompany;
  } catch {
    return null;
  }
}
