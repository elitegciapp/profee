import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TitleCompany } from "../models/titleCompany";

const STORAGE_KEY = "PROFEE_TITLE_COMPANIES";

export async function getAllTitleCompanies(): Promise<TitleCompany[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as TitleCompany[]) : [];
}

export async function saveTitleCompany(company: TitleCompany) {
  const existing = await getAllTitleCompanies();
  const updated = [company, ...existing.filter((c) => c.id !== company.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteTitleCompany(id: string) {
  const existing = await getAllTitleCompanies();
  const updated = existing.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
