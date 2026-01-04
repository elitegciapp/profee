import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Statement } from "../models/statement";

export const STORAGE_KEY = "PROFEE_STATEMENTS";

function safeParse(raw: string | null): Statement[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Statement[]) : [];
  } catch {
    return [];
  }
}

export async function getAllStatements(): Promise<Statement[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
}

export async function getStatementById(id: string): Promise<Statement | null> {
  const existing = await getAllStatements();
  return existing.find((s) => s.id === id) ?? null;
}

export async function upsertStatement(statement: Statement): Promise<void> {
  const existing = await getAllStatements();

  const index = existing.findIndex((s) => s.id === statement.id);

  let updated: Statement[];

  if (index >= 0) {
    updated = [...existing];
    updated[index] = statement;
  } else {
    updated = [statement, ...existing];
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteStatement(id: string): Promise<void> {
  const existing = await getAllStatements();
  const updated = existing.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function getLatestStatement(): Promise<Statement | null> {
  const existing = await getAllStatements();
  if (existing.length === 0) return null;

  const latest = existing
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];

  return latest ?? null;
}
