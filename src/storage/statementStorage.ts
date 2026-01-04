import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Statement } from "@/src/models/statement";

const STATEMENTS_KEY = "@profee/statements";

function safeParseStatements(json: string | null): Statement[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? (parsed as Statement[]) : [];
  } catch {
    return [];
  }
}

export async function listStatements(): Promise<Statement[]> {
  const json = await AsyncStorage.getItem(STATEMENTS_KEY);
  return safeParseStatements(json);
}

export async function getLatestStatement(): Promise<Statement | null> {
  const statements = await listStatements();
  if (statements.length === 0) return null;

  const latest = statements
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];

  return latest ?? null;
}

export async function saveStatement(statement: Statement): Promise<void> {
  const statements = await listStatements();

  const next = [statement, ...statements.filter((s) => s.id !== statement.id)];

  await AsyncStorage.setItem(STATEMENTS_KEY, JSON.stringify(next));
}

export async function deleteStatement(id: string): Promise<void> {
  const statements = await listStatements();
  const next = statements.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STATEMENTS_KEY, JSON.stringify(next));
}
